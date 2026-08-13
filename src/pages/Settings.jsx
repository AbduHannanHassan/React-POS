import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ThemeToggle from "../components/ThemeToggle";
import { changePassword, updateProfile } from "../config/appwrite";
import { setUser } from "../store/slices/authSlice";

// ─── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─── Field component ───────────────────────────────────────────────────────────
const Field = ({ label, id, type = "text", value, onChange, placeholder, readOnly }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={readOnly ? undefined : onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all
        ${readOnly
          ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        }`}
    />
  </div>
);

// ─── Account tab ──────────────────────────────────────────────────────────────
function AccountSettings() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const [name, setName]           = useState(user?.name || "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg]     = useState(null);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwMsg, setPwMsg]         = useState(null);

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setNameSaving(true);
    setNameMsg(null);
    try {
      const res = await updateProfile(name.trim());
      if (res.success) {
        dispatch(setUser(res.data));
        setNameMsg({ ok: true, text: "Name updated!" });
      } else {
        setNameMsg({ ok: false, text: res.error || "Failed to update name" });
      }
    } catch {
      setNameMsg({ ok: false, text: "Network error" });
    } finally {
      setNameSaving(false);
      setTimeout(() => setNameMsg(null), 3000);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ ok: false, text: "New passwords do not match" });
      return;
    }
    if (pwForm.next.length < 6) {
      setPwMsg({ ok: false, text: "New password must be at least 6 characters" });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const res = await changePassword(pwForm.current, pwForm.next);
      if (res.success) {
        setPwMsg({ ok: true, text: "Password changed successfully!" });
        setPwForm({ current: "", next: "", confirm: "" });
      } else {
        setPwMsg({ ok: false, text: res.error || "Failed to change password" });
      }
    } catch {
      setPwMsg({ ok: false, text: "Network error" });
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Email" id="account-email" value={user?.email || ""} readOnly />
          <Field label="Role" id="account-role" value={user?.role || "cashier"} readOnly />
        </div>
        <form onSubmit={handleSaveName} className="space-y-3">
          <Field label="Display Name" id="account-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          {nameMsg && (
            <p className={`text-sm font-medium ${nameMsg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {nameMsg.ok ? "✓ " : "❌ "}{nameMsg.text}
            </p>
          )}
          <button id="account-save-name" type="submit" disabled={nameSaving || name === user?.name}
            className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 disabled:opacity-40 transition-colors flex items-center gap-2">
            {nameSaving ? <><Spinner /> Saving…</> : "Save Name"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <Field label="Current Password" id="pw-current" type="password" value={pwForm.current}
            onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} placeholder="Your current password" />
          <Field label="New Password" id="pw-next" type="password" value={pwForm.next}
            onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} placeholder="Min. 6 characters" />
          <Field label="Confirm New Password" id="pw-confirm" type="password" value={pwForm.confirm}
            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="Repeat new password" />
          {pwMsg && (
            <p className={`text-sm font-medium ${pwMsg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {pwMsg.ok ? "✓ " : "❌ "}{pwMsg.text}
            </p>
          )}
          <button id="account-change-password" type="submit"
            disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}
            className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 disabled:opacity-40 transition-colors flex items-center gap-2">
            {pwSaving ? <><Spinner /> Changing…</> : "Change Password"}
          </button>
        </form>
      </div>

      {/* Backend info */}
      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-4 border border-blue-200 dark:border-blue-800/50">
        <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1">🗄 Backend</p>
        <p className="text-xs text-blue-600 dark:text-blue-400/80">
          Running on <strong>SQLite</strong> (local). Data is stored in <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">backend/pos.db</code>.
          To reset all data, delete that file and restart the server.
        </p>
      </div>
    </div>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "general", label: "General", icon: "⚙️" },
  { id: "account", label: "Account", icon: "👤" },
];

// ─── Main Settings page ────────────────────────────────────────────────────────
function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const user = useSelector((s) => s.auth.user);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-secondary rounded-2xl shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-1 text-text-primary">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your preferences and account.</p>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
          {TABS.map((tab) => (
            <button key={tab.id} id={`settings-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {activeTab === "general" && (
          <div className="space-y-4">
            <ThemeToggle />
          </div>
        )}

        {activeTab === "account" && (
          user
            ? <AccountSettings />
            : <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Please log in to manage your account settings.</p>
        )}
      </div>
    </div>
  );
}

export default Settings;
