import { useNavigate } from "react-router-dom";

function PasswordRecovery() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
        <div className="text-4xl">🔑</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Password Recovery</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          This app uses a local SQLite database. To change your password,
          log in and go to <strong>Settings → Account</strong>.
        </p>
        <button
          onClick={() => navigate("/")}
          className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}

export default PasswordRecovery;
