/**
 * api.js — SQLite backend client (replaces appwrite.js)
 * All auth and data operations go through the local Express server.
 */

const BASE_URL = "/api"; // proxied by Vite to http://localhost:3001
const TOKEN_KEY = "pos_auth_token";

// ─── Token helpers ─────────────────────────────────────────────────────────────
export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || null; } catch { return null; }
};

const saveToken = (token) => {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
};

const clearToken = () => {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
};

// ─── Fetch wrapper ─────────────────────────────────────────────────────────────
const request = async (method, path, body = null, auth = false) => {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const opts = { method, headers };
  if (body !== null) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE_URL}${path}`, opts);
    const json = await res.json();
    return json;
  } catch (err) {
    console.error(`API ${method} ${path} failed:`, err);
    return { success: false, error: "Network error – is the backend server running?" };
  }
};

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const login = async (email, password) => {
  const res = await request("POST", "/auth/login", { email, password });
  if (res.success && res.token) saveToken(res.token);
  return res;
};

export const register = async (email, password, name) => {
  const res = await request("POST", "/auth/register", { email, password, name });
  if (res.success && res.token) saveToken(res.token);
  // Return shape compatible with old appwrite.js (no OTP needed)
  return res;
};

export const logout = async () => {
  await request("POST", "/auth/logout", null, true);
  clearToken();
  return { success: true };
};

export const getCurrentUser = async () => {
  if (!getToken()) return { success: false, error: "Not authenticated" };
  return await request("GET", "/auth/me", null, true);
};

export const changePassword = async (currentPassword, newPassword) => {
  return await request("PUT", "/auth/change-password", { currentPassword, newPassword }, true);
};

export const updateProfile = async (name) => {
  return await request("PUT", "/auth/profile", { name }, true);
};

// Stubs kept for compatibility (no-op in SQLite mode)
export const sendPasswordResetEmail = async () => ({ success: false, error: "Use Settings → Account to change your password" });
export const resetPassword = async () => ({ success: false, error: "Use Settings → Account to change your password" });
export const verifyOTP = async () => ({ success: false, error: "Not supported" });

// ─── Data CRUD ─────────────────────────────────────────────────────────────────
export const getCollectionData = async (collection) => {
  const res = await request("GET", `/data/${collection}`, null, true);
  return res;
};

export const saveCollectionData = async (collection, data) => {
  return await request("PUT", `/data/${collection}`, { data }, true);
};

// Kept for backwards compatibility with components that call these directly
export const getDocuments = async (collection) => {
  const res = await getCollectionData(collection);
  return res.data ? [{ data: JSON.stringify(res.data) }] : [];
};

export const createDocument = async (collection, data) => {
  return await saveCollectionData(collection, data);
};

export const updateDocument = async (collection, _, data) => {
  return await saveCollectionData(collection, data);
};

// ─── Profile picture upload ────────────────────────────────────────────────────
export const uploadProfilePicture = async (file) => {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${BASE_URL}/upload/profile`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ─── Health check ──────────────────────────────────────────────────────────────
export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const json = await res.json();
    return { online: json.success === true };
  } catch {
    return { online: false };
  }
};

// ─── Legacy exports (referenced across the codebase) ──────────────────────────
// These are no-ops / stubs to avoid import errors during migration
export const account = null;
export const databases = null;
export const storage = null;
export const getConfig = () => ({});
export const getStoredConfig = () => null;
export const saveConfig = () => {};
export const clearConfig = () => {};
export const reinitializeClient = () => {};
export const testConnection = async () => ({ success: false, error: "Not applicable" });
export const getAccount = () => null;
export const getDatabases = () => null;
export const getStorage = () => null;
export const ID = { unique: () => Math.random().toString(36).slice(2) };
export const Query = { equal: () => {} };
