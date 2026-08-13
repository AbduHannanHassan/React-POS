const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { db } = require("./db");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "pos-sqlite-secret-key-change-in-production";
const JWT_EXPIRES = "7d";

// ─── Uploads directory ─────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:4173"], credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

// ─── File upload config ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ─── JWT auth middleware ───────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Not authenticated" });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

// ─── Helper ────────────────────────────────────────────────────────────────────
const safeUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, avatarUrl: u.avatar_url || "", createdAt: u.created_at });

// ─────────────────────────────────────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, error: "Name, email and password are required" });

  if (password.length < 6)
    return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (existing)
    return res.status(409).json({ success: false, error: "An account with this email already exists" });

  try {
    const id = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    db.prepare("INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)").run(
      id, name.trim(), email.toLowerCase().trim(), hash, "cashier"
    );

    // Create empty data collections for the new user
    const insertData = db.prepare("INSERT INTO user_data (id, user_id, collection, data) VALUES (?, ?, ?, ?)");
    const emptyExpenses = JSON.stringify({ expenses: [], categories: ["Rent","Salaries","Utilities","Supplies","Marketing","Insurance","Maintenance","Other"] });
    insertData.run(uuidv4(), id, "inventory", JSON.stringify({ products: [] }));
    insertData.run(uuidv4(), id, "sales",     JSON.stringify({ sales: [], todayTotal: 0 }));
    insertData.run(uuidv4(), id, "purchases", JSON.stringify({ purchases: [] }));
    insertData.run(uuidv4(), id, "expenses",  emptyExpenses);
    insertData.run(uuidv4(), id, "userdata",  JSON.stringify({ profilePictureUrl: "" }));

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.status(201).json({ success: true, token, data: safeUser(user) });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, error: "Email and password are required" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ success: false, error: "Invalid email or password" });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.json({ success: true, token, data: safeUser(user) });
});

// GET /api/auth/me
app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  if (!user) return res.status(404).json({ success: false, error: "User not found" });
  res.json({ success: true, data: safeUser(user) });
});

// POST /api/auth/logout  (client just deletes the token, this is a no-op)
app.post("/api/auth/logout", requireAuth, (req, res) => {
  res.json({ success: true });
});

// PUT /api/auth/change-password
app.put("/api/auth/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ success: false, error: "Current and new password required" });
  if (newPassword.length < 6)
    return res.status(400).json({ success: false, error: "New password must be at least 6 characters" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  if (!bcrypt.compareSync(currentPassword, user.password_hash))
    return res.status(401).json({ success: false, error: "Current password is incorrect" });

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, req.userId);
  res.json({ success: true });
});

// PUT /api/auth/profile  (update name)
app.put("/api/auth/profile", requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: "Name is required" });
  db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name.trim(), req.userId);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  res.json({ success: true, data: safeUser(user) });
});

// ─────────────────────────────────────────────────────────────────────────────
// DATA ROUTES (per-user JSON blobs, one per collection)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/data/:collection
app.get("/api/data/:collection", requireAuth, (req, res) => {
  const { collection } = req.params;
  const row = db.prepare("SELECT data FROM user_data WHERE user_id = ? AND collection = ?").get(req.userId, collection);
  if (!row) return res.json({ success: true, data: null });
  try {
    res.json({ success: true, data: JSON.parse(row.data) });
  } catch {
    res.json({ success: true, data: null });
  }
});

// PUT /api/data/:collection
app.put("/api/data/:collection", requireAuth, (req, res) => {
  const { collection } = req.params;
  const { data } = req.body;
  if (data === undefined) return res.status(400).json({ success: false, error: "data field required" });

  const serialized = JSON.stringify(data);
  const existing = db.prepare("SELECT id FROM user_data WHERE user_id = ? AND collection = ?").get(req.userId, collection);

  if (existing) {
    db.prepare("UPDATE user_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND collection = ?")
      .run(serialized, req.userId, collection);
  } else {
    db.prepare("INSERT INTO user_data (id, user_id, collection, data) VALUES (?, ?, ?, ?)")
      .run(uuidv4(), req.userId, collection, serialized);
  }
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PICTURE UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/upload/profile
app.post("/api/upload/profile", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

  const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;

  // Delete old avatar file if it was locally hosted
  const user = db.prepare("SELECT avatar_url FROM users WHERE id = ?").get(req.userId);
  if (user?.avatar_url?.includes("/uploads/")) {
    const oldFile = path.join(UPLOADS_DIR, path.basename(user.avatar_url));
    if (fs.existsSync(oldFile)) {
      try { fs.unlinkSync(oldFile); } catch { /* ignore */ }
    }
  }

  db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(fileUrl, req.userId);

  // Also update userdata collection
  const existing = db.prepare("SELECT data FROM user_data WHERE user_id = ? AND collection = ?").get(req.userId, "userdata");
  let userData = { profilePictureUrl: fileUrl };
  if (existing) {
    try {
      userData = { ...JSON.parse(existing.data), profilePictureUrl: fileUrl };
      db.prepare("UPDATE user_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND collection = ?")
        .run(JSON.stringify(userData), req.userId, "userdata");
    } catch { /* ignore */ }
  }

  res.json({ success: true, fileUrl });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: List all users (for debugging)
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/admin/users", requireAuth, (req, res) => {
  const requester = db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
  if (requester?.role !== "admin")
    return res.status(403).json({ success: false, error: "Admin only" });

  const users = db.prepare("SELECT id, name, email, role, created_at FROM users").all();
  res.json({ success: true, data: users });
});

// ─── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ success: true, message: "POS Backend running", db: "SQLite" }));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 POS Backend running at http://localhost:${PORT}`);
  console.log(`📦 SQLite database: ${require("path").join(__dirname, "pos.db")}\n`);
});
