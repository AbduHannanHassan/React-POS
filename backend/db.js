const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const DB_PATH = path.join(__dirname, "pos.db");
const db = new Database(DB_PATH);

// ─── Performance settings ──────────────────────────────────────────────────
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'cashier',
    avatar_url  TEXT DEFAULT '',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_data (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    collection  TEXT NOT NULL,
    data        TEXT NOT NULL DEFAULT '{}',
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, collection)
  );

  CREATE INDEX IF NOT EXISTS idx_user_data_user ON user_data(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_data_col  ON user_data(user_id, collection);
`);

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE_PRODUCTS = [
  { id: "prod_1", name: "Espresso",        category: "Beverages", price: 2.50, cost: 0.80, stock: 200, minStock: 20, barcode: "1001", unit: "cup",    description: "Strong Italian coffee" },
  { id: "prod_2", name: "Cappuccino",      category: "Beverages", price: 3.50, cost: 1.20, stock: 150, minStock: 20, barcode: "1002", unit: "cup",    description: "Coffee with steamed milk foam" },
  { id: "prod_3", name: "Green Tea",       category: "Beverages", price: 2.00, cost: 0.50, stock: 300, minStock: 30, barcode: "1003", unit: "cup",    description: "Refreshing green tea" },
  { id: "prod_4", name: "Croissant",       category: "Bakery",    price: 2.00, cost: 0.70, stock:  80, minStock: 10, barcode: "2001", unit: "piece",  description: "Buttery French pastry" },
  { id: "prod_5", name: "Blueberry Muffin",category: "Bakery",    price: 2.50, cost: 0.90, stock:  60, minStock: 10, barcode: "2002", unit: "piece",  description: "Fresh baked muffin" },
  { id: "prod_6", name: "Caesar Salad",    category: "Food",      price: 7.50, cost: 2.50, stock:  40, minStock:  5, barcode: "3001", unit: "plate",  description: "Classic caesar salad" },
  { id: "prod_7", name: "Club Sandwich",   category: "Food",      price: 8.00, cost: 3.00, stock:  35, minStock:  5, barcode: "3002", unit: "piece",  description: "Triple decker sandwich" },
  { id: "prod_8", name: "Still Water 500ml",category:"Beverages", price: 1.00, cost: 0.20, stock: 500, minStock: 50, barcode: "1004", unit: "bottle", description: "Still mineral water" },
  { id: "prod_9", name: "Orange Juice",    category: "Beverages", price: 3.00, cost: 1.00, stock: 120, minStock: 20, barcode: "1005", unit: "glass",  description: "Freshly squeezed OJ" },
  { id: "prod_10",name: "Chocolate Cake",  category: "Bakery",    price: 4.50, cost: 1.80, stock:  25, minStock:  5, barcode: "2003", unit: "slice",  description: "Rich chocolate layer cake" },
];

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const SAMPLE_SALES = [
  { id: "sale_1", date: daysAgo(0), total: 15.50, discount: 0, paymentMethod: "cash",
    items: [{ productId: "prod_1", name: "Espresso", qty: 2, price: 2.50 }, { productId: "prod_4", name: "Croissant", qty: 1, price: 2.00 }, { productId: "prod_8", name: "Still Water 500ml", qty: 3, price: 1.00 }] },
  { id: "sale_2", date: daysAgo(0), total: 22.00, discount: 1.00, paymentMethod: "card",
    items: [{ productId: "prod_6", name: "Caesar Salad", qty: 1, price: 7.50 }, { productId: "prod_7", name: "Club Sandwich", qty: 1, price: 8.00 }, { productId: "prod_2", name: "Cappuccino", qty: 2, price: 3.50 }] },
  { id: "sale_3", date: daysAgo(1), total:  8.50, discount: 0, paymentMethod: "cash",
    items: [{ productId: "prod_3", name: "Green Tea", qty: 1, price: 2.00 }, { productId: "prod_10", name: "Chocolate Cake", qty: 1, price: 4.50 }, { productId: "prod_8", name: "Still Water 500ml", qty: 2, price: 1.00 }] },
  { id: "sale_4", date: daysAgo(2), total: 31.00, discount: 2.00, paymentMethod: "card",
    items: [{ productId: "prod_6", name: "Caesar Salad", qty: 2, price: 7.50 }, { productId: "prod_7", name: "Club Sandwich", qty: 2, price: 8.00 }] },
  { id: "sale_5", date: daysAgo(3), total: 12.00, discount: 0, paymentMethod: "cash",
    items: [{ productId: "prod_1", name: "Espresso", qty: 3, price: 2.50 }, { productId: "prod_5", name: "Blueberry Muffin", qty: 1, price: 2.50 }, { productId: "prod_4", name: "Croissant", qty: 1, price: 2.00 }] },
  { id: "sale_6", date: daysAgo(5), total: 17.50, discount: 0, paymentMethod: "cash",
    items: [{ productId: "prod_9", name: "Orange Juice", qty: 2, price: 3.00 }, { productId: "prod_7", name: "Club Sandwich", qty: 1, price: 8.00 }, { productId: "prod_4", name: "Croissant", qty: 1, price: 2.00 }] },
  { id: "sale_7", date: daysAgo(7), total: 14.00, discount: 1.00, paymentMethod: "card",
    items: [{ productId: "prod_2", name: "Cappuccino", qty: 2, price: 3.50 }, { productId: "prod_5", name: "Blueberry Muffin", qty: 2, price: 2.50 }, { productId: "prod_8", name: "Still Water 500ml", qty: 2, price: 1.00 }] },
];

const SAMPLE_PURCHASES = [
  { id: "pur_1", date: daysAgo(5),  supplier: "Morning Roast Co.",  total: 120.00, status: "received",
    items: [{ productId: "prod_1", name: "Espresso Beans", qty: 50, cost: 0.80, total: 40.00 }, { productId: "prod_2", name: "Milk (Wholesale)", qty: 100, cost: 0.50, total: 50.00 }, { productId: "prod_4", name: "Croissants (batch)", qty: 40, cost: 0.75, total: 30.00 }] },
  { id: "pur_2", date: daysAgo(10), supplier: "Fresh Farms Ltd.",    total:  95.00, status: "received",
    items: [{ productId: "prod_3", name: "Green Tea Leaves", qty: 200, cost: 0.25, total: 50.00 }, { productId: "prod_9", name: "Oranges", qty: 90, cost: 0.50, total: 45.00 }] },
  { id: "pur_3", date: daysAgo(15), supplier: "Bakery Supplies Co.", total:  68.00, status: "received",
    items: [{ productId: "prod_10", name: "Cake Mix & Ingredients", qty: 20, cost: 2.40, total: 48.00 }, { productId: "prod_5", name: "Muffin Ingredients", qty: 40, cost: 0.50, total: 20.00 }] },
];

const SAMPLE_EXPENSES = {
  expenses: [
    { id: "exp_1", date: daysAgo(1),  category: "Utilities",   amount: 150.00, description: "Monthly electricity bill",  paymentMethod: "bank" },
    { id: "exp_2", date: daysAgo(3),  category: "Salaries",    amount: 1200.00,description: "Staff wages – week 1",      paymentMethod: "bank" },
    { id: "exp_3", date: daysAgo(7),  category: "Rent",        amount: 800.00, description: "Monthly rent",              paymentMethod: "bank" },
    { id: "exp_4", date: daysAgo(10), category: "Supplies",    amount:  45.00, description: "Cleaning & packaging",      paymentMethod: "cash" },
    { id: "exp_5", date: daysAgo(14), category: "Marketing",   amount:  60.00, description: "Social media ads",          paymentMethod: "card" },
    { id: "exp_6", date: daysAgo(20), category: "Maintenance", amount:  90.00, description: "Equipment service",         paymentMethod: "cash" },
    { id: "exp_7", date: daysAgo(25), category: "Insurance",   amount: 220.00, description: "Monthly insurance premium", paymentMethod: "bank" },
  ],
  categories: ["Rent","Salaries","Utilities","Supplies","Marketing","Insurance","Maintenance","Other"],
};

// ─── Demo users ──────────────────────────────────────────────────────────────
const DEMO_USERS = [
  { id: uuidv4(), name: "Admin User",    email: "admin@pos.local",   password: "Admin@123",   role: "admin"   },
  { id: uuidv4(), name: "Store Manager", email: "manager@pos.local", password: "Manager@123", role: "manager" },
  { id: uuidv4(), name: "Demo Cashier",  email: "cashier@pos.local", password: "Cashier@123", role: "cashier" },
];

// ─── Seed function (idempotent) ────────────────────────────────────────────────
const seedDatabase = db.transaction(() => {
  const existingUsers = db.prepare("SELECT COUNT(*) as count FROM users").get();
  if (existingUsers.count > 0) return; // already seeded

  console.log("🌱 Seeding demo users and sample data...");

  const insertUser = db.prepare(
    "INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)"
  );
  const insertData = db.prepare(
    "INSERT INTO user_data (id, user_id, collection, data) VALUES (?, ?, ?, ?)"
  );

  const todaySales = SAMPLE_SALES.filter((s) =>
    s.date.startsWith(new Date().toISOString().slice(0, 10))
  );
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);

  for (const user of DEMO_USERS) {
    const hash = bcrypt.hashSync(user.password, 10);
    insertUser.run(user.id, user.name, user.email, hash, user.role);

    // Each demo user gets the same sample data
    insertData.run(uuidv4(), user.id, "inventory", JSON.stringify({ products: SAMPLE_PRODUCTS }));
    insertData.run(uuidv4(), user.id, "sales",     JSON.stringify({ sales: SAMPLE_SALES, todayTotal }));
    insertData.run(uuidv4(), user.id, "purchases", JSON.stringify({ purchases: SAMPLE_PURCHASES }));
    insertData.run(uuidv4(), user.id, "expenses",  JSON.stringify(SAMPLE_EXPENSES));
    insertData.run(uuidv4(), user.id, "userdata",  JSON.stringify({ profilePictureUrl: "" }));
  }

  console.log(`✅ Seeded ${DEMO_USERS.length} demo users with sample data`);
  console.log("   admin@pos.local    / Admin@123");
  console.log("   manager@pos.local  / Manager@123");
  console.log("   cashier@pos.local  / Cashier@123");
});

// Run seed on startup
seedDatabase();

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = { db, DEMO_USERS };
