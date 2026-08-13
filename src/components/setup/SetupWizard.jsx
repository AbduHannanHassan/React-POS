import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setDbConfig, markSetupComplete } from "../../store/slices/dbConfigSlice";
import { reinitializeClient, testConnection } from "../../config/appwrite";
import { installSchema } from "./SchemaInstaller";
import { installSampleData } from "./SampleDataInstaller";
import { resetInitialDataFlag } from "../../store/middleware/localStorageMiddleware";

// ─── Icons ────────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const SpinIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);
const DatabaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M12 2C8.13 2 5 3.34 5 5v14c0 1.66 3.13 3 7 3s7-1.34 7-3V5c0-1.66-3.13-3-7-3zm0 2c3.31 0 5 1.01 5 1.5S15.31 7 12 7 7 5.99 7 5.5 8.69 4 12 4zm0 16c-3.31 0-5-1.01-5-1.5v-1.8C8.56 17.5 10.22 18 12 18s3.44-.5 5-1.3V18.5c0 .49-1.69 1.5-5 1.5zm5-5.3c-1.56.8-3.22 1.3-5 1.3s-3.44-.5-5-1.3v-2.2C8.56 13.5 10.22 14 12 14s3.44-.5 5-1.3v2.2zm0-5.2C15.44 10.5 13.78 11 12 11s-3.44-.5-5-1.3V7.5C8.56 8.5 10.22 9 12 9s3.44-.5 5-1.3v1.2z"/>
  </svg>
);

// ─── Step indicator ───────────────────────────────────────────────────────────
const steps = [
  { label: "Welcome" },
  { label: "Connect" },
  { label: "Schema" },
  { label: "Sample Data" },
  { label: "Done" },
];

const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center gap-0 mb-8 select-none">
    {steps.map((s, i) => (
      <div key={s.label} className="flex items-center">
        <div className="flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              i < current
                ? "bg-emerald-500 text-white"
                : i === current
                ? "bg-violet-600 text-white ring-4 ring-violet-200 dark:ring-violet-900"
                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            }`}
          >
            {i < current ? <CheckIcon /> : i + 1}
          </div>
          <span
            className={`text-[10px] mt-1 font-medium transition-colors ${
              i === current ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {s.label}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div
            className={`w-10 h-0.5 mb-5 mx-1 transition-all duration-500 ${
              i < current ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        )}
      </div>
    ))}
  </div>
);

// ─── Input component ──────────────────────────────────────────────────────────
const Field = ({ label, name, value, onChange, placeholder, type = "text", hint }) => (
  <div className="space-y-1">
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
    <input
      id={`setup-field-${name}`}
      type={type}
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm font-mono"
      autoComplete="off"
      spellCheck={false}
    />
    {hint && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
  </div>
);

// ─── Log terminal ─────────────────────────────────────────────────────────────
const LogTerminal = ({ logs }) => (
  <div className="mt-4 rounded-xl bg-gray-900 text-emerald-400 font-mono text-xs p-4 h-40 overflow-y-auto space-y-0.5 border border-gray-700">
    {logs.length === 0 && <span className="text-gray-500">Waiting…</span>}
    {logs.map((l, i) => (
      <div key={i} className="leading-5">{l}</div>
    ))}
  </div>
);

// ─── Main wizard ──────────────────────────────────────────────────────────────
export default function SetupWizard({ onComplete, userId }) {
  const dispatch = useDispatch();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    endpoint: "",
    projectId: "",
    databaseId: "",
    apiKey: "",
  });
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'ok' | 'fail'
  const [testError, setTestError] = useState("");
  const [schemaLogs, setSchemaLogs] = useState([]);
  const [schemaStatus, setSchemaStatus] = useState(null); // null | 'running' | 'done' | 'error'
  const [schemaError, setSchemaError] = useState("");
  const [collectionIds, setCollectionIds] = useState(null);
  const [sampleLogs, setSampleLogs] = useState([]);
  const [sampleStatus, setSampleStatus] = useState(null); // null | 'running' | 'done' | 'error'
  const [sampleError, setSampleError] = useState("");
  const [skippedSample, setSkippedSample] = useState(false);

  const updateField = useCallback((name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
  }, []);

  // ── Step 1: Test connection ────────────────────────────────────────────────
  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestError("");
    const result = await testConnection(form.endpoint.trim(), form.projectId.trim());
    if (result.success) {
      setTestStatus("ok");
    } else {
      setTestStatus("fail");
      setTestError(result.error || "Unknown error");
    }
  };

  const handleSaveConnection = () => {
    // Apply config and move to schema step
    reinitializeClient({
      endpoint: form.endpoint.trim(),
      projectId: form.projectId.trim(),
      databaseId: form.databaseId.trim(),
      collectionIds: {},
      setupComplete: false,
    });
    dispatch(setDbConfig({
      endpoint: form.endpoint.trim(),
      projectId: form.projectId.trim(),
      databaseId: form.databaseId.trim(),
      collectionIds: {},
      setupComplete: false,
    }));
    setStep(2);
  };

  // ── Step 2: Install schema ─────────────────────────────────────────────────
  const handleInstallSchema = async () => {
    setSchemaStatus("running");
    setSchemaLogs([]);
    setSchemaError("");
    try {
      const ids = await installSchema({
        endpoint: form.endpoint.trim(),
        projectId: form.projectId.trim(),
        apiKey: form.apiKey.trim(),
        databaseId: form.databaseId.trim(),
        onProgress: (msg) => setSchemaLogs((prev) => [...prev, msg]),
      });
      setCollectionIds(ids);
      // Save the new collection IDs into config
      const newConfig = {
        endpoint: form.endpoint.trim(),
        projectId: form.projectId.trim(),
        databaseId: form.databaseId.trim(),
        collectionIds: ids,
        setupComplete: false,
      };
      reinitializeClient(newConfig);
      dispatch(setDbConfig(newConfig));
      setSchemaStatus("done");
    } catch (err) {
      setSchemaStatus("error");
      setSchemaError(err.message);
      setSchemaLogs((prev) => [...prev, `❌ Error: ${err.message}`]);
    }
  };

  // ── Step 3: Sample data ────────────────────────────────────────────────────
  const handleInstallSampleData = async () => {
    setSampleStatus("running");
    setSampleLogs([]);
    setSampleError("");
    try {
      await installSampleData({
        endpoint: form.endpoint.trim(),
        projectId: form.projectId.trim(),
        collectionIds,
        databaseId: form.databaseId.trim(),
        userId,
        onProgress: (msg) => setSampleLogs((prev) => [...prev, msg]),
      });
      setSampleStatus("done");
    } catch (err) {
      setSampleStatus("error");
      setSampleError(err.message);
      setSampleLogs((prev) => [...prev, `❌ Error: ${err.message}`]);
    }
  };

  const handleSkipSampleData = () => {
    setSkippedSample(true);
    setStep(4);
  };

  // ── Finish ─────────────────────────────────────────────────────────────────
  const handleFinish = () => {
    dispatch(markSetupComplete());
    resetInitialDataFlag();
    onComplete?.();
  };

  // ─── Render steps ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <DatabaseIcon />
            <h1 className="text-xl font-bold">Database Setup Wizard</h1>
          </div>
          <p className="text-sm text-violet-200">Connect your Appwrite backend to get started</p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <StepIndicator current={step} />

          {/* ── Step 0: Welcome ─────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-12 h-12 text-violet-600" fill="currentColor">
                    <path d="M32 4C16.536 4 4 16.536 4 32s12.536 28 28 28 28-12.536 28-28S47.464 4 32 4zm0 4c13.255 0 24 10.745 24 24S45.255 56 32 56 8 45.255 8 32 18.745 8 32 8zm-2 10v14H18l14 14 14-14H34V18h-4z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to React POS</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  This wizard will help you connect your <strong>Appwrite</strong> database, 
                  create the required schema, and optionally load sample data — all in just a few steps.
                </p>
              </div>

              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">What you will need:</p>
                {[
                  "An Appwrite account (cloud.appwrite.io or self-hosted)",
                  "A Project ID and endpoint URL",
                  "A Database ID (create one in Appwrite console first)",
                  "A Server API Key with databases.write permission (for schema creation)",
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href="https://cloud.appwrite.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 border-2 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 rounded-xl text-sm font-semibold text-center hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                >
                  Open Appwrite Console ↗
                </a>
                <button
                  id="setup-next-welcome"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/25"
                >
                  Let's Get Started →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Connect ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Connect to Appwrite</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Enter your Appwrite project credentials.</p>
              </div>

              <Field label="Appwrite Endpoint" name="endpoint" value={form.endpoint} onChange={updateField}
                placeholder="https://cloud.appwrite.io/v1" hint="Found in your Appwrite console → Settings" />
              <Field label="Project ID" name="projectId" value={form.projectId} onChange={updateField}
                placeholder="your-project-id" hint="Found in Settings → Project ID" />
              <Field label="Database ID" name="databaseId" value={form.databaseId} onChange={updateField}
                placeholder="your-database-id" hint="Create a database in Databases → click to copy ID" />
              <Field label="Server API Key" name="apiKey" value={form.apiKey} onChange={updateField}
                placeholder="standard_xxxxx…" type="password"
                hint="Create in Settings → API Keys → Add key (databases.write scope)" />

              {testStatus === "ok" && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 rounded-xl">
                  <CheckIcon /> Connection successful!
                </div>
              )}
              {testStatus === "fail" && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl">
                  ❌ {testError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button id="setup-test-connection" onClick={handleTestConnection}
                  disabled={!form.endpoint || !form.projectId || testStatus === "testing"}
                  className="flex-1 py-2.5 border-2 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testStatus === "testing" ? <><SpinIcon /> Testing…</> : "Test Connection"}
                </button>
                <button id="setup-next-connect"
                  onClick={handleSaveConnection}
                  disabled={!form.endpoint || !form.projectId || !form.databaseId || !form.apiKey}
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-lg shadow-violet-500/25"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Schema ───────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Install Database Schema</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  This will create the required collections in your Appwrite database.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Collections to create</p>
                {["inventory", "sales", "purchases", "expenses", "users"].map((c) => (
                  <div key={c} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="w-2 h-2 bg-violet-400 rounded-full flex-shrink-0" />
                    {c}
                    {collectionIds?.[c === "users" ? "user" : c] && (
                      <span className="ml-auto text-xs font-mono text-emerald-500">{collectionIds[c === "users" ? "user" : c]}</span>
                    )}
                  </div>
                ))}
              </div>

              <LogTerminal logs={schemaLogs} />

              {schemaStatus === "error" && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl">
                  ❌ {schemaError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(1)} disabled={schemaStatus === "running"}
                  className="px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                  ← Back
                </button>
                {schemaStatus !== "done" ? (
                  <button id="setup-install-schema" onClick={handleInstallSchema}
                    disabled={schemaStatus === "running"}
                    className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2">
                    {schemaStatus === "running" ? <><SpinIcon /> Installing…</> : "Install Schema"}
                  </button>
                ) : (
                  <button id="setup-next-schema" onClick={() => setStep(3)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25">
                    Continue →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Sample data ──────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Install Sample Data</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Optionally load demo products, sales, purchases and expenses to explore the POS.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "📦", label: "10 Products", sub: "Beverages, bakery & food" },
                  { icon: "💰", label: "5 Sales", sub: "Last 3 days of activity" },
                  { icon: "🛒", label: "2 Purchases", sub: "With supplier details" },
                  { icon: "📊", label: "5 Expenses", sub: "Rent, salaries, utilities" },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {sampleStatus && <LogTerminal logs={sampleLogs} />}

              {sampleStatus === "error" && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl">
                  ❌ {sampleError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                {sampleStatus !== "done" ? (
                  <>
                    <button id="setup-skip-sample" onClick={handleSkipSampleData}
                      disabled={sampleStatus === "running"}
                      className="flex-1 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                      Skip
                    </button>
                    <button id="setup-install-sample" onClick={handleInstallSampleData}
                      disabled={!userId || sampleStatus === "running"}
                      className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2">
                      {sampleStatus === "running" ? <><SpinIcon /> Installing…</> : "Install Sample Data"}
                    </button>
                  </>
                ) : (
                  <button id="setup-next-sample" onClick={() => setStep(4)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg">
                    Continue →
                  </button>
                )}
              </div>

              {!userId && (
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                  ⚠ You must be logged in to install sample data. Skip or log in first.
                </p>
              )}
            </div>
          )}

          {/* ── Step 4: Done ─────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-12 h-12 text-emerald-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Set! 🎉</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Your database is connected and the schema is installed.
                  {!skippedSample && sampleStatus === "done" && " Sample data has been loaded — explore the Dashboard to see it in action."}
                  {skippedSample && " You chose to skip sample data. You can add your own data from the Inventory and Sales pages."}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Connection Summary</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Endpoint</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200 text-xs truncate max-w-[200px]">{form.endpoint}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Project ID</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200 text-xs">{form.projectId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Database ID</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200 text-xs">{form.databaseId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Collections</span>
                    <span className="text-emerald-500 text-xs font-semibold">{collectionIds ? Object.keys(collectionIds).length : 0} created</span>
                  </div>
                </div>
              </div>

              <button id="setup-finish" onClick={handleFinish}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/25">
                Go to Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
