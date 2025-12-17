import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAdminAuthed, loginAdmin } from "./adminAuth";

function AdminAuthGate({ children }) {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => isAdminAuthed());

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return username.trim().length > 0 && password.length > 0;
  }, [username, password]);

  const handleLogin = () => {
    setError("");
    const ok = loginAdmin(username.trim(), password);
    if (!ok) {
      setError("Invalid username or password.");
      return;
    }
    setAuthed(true);
  };

  if (authed) return children;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100">
      <div className="w-full max-w-md rounded-lg border border-gray-300 bg-white p-6 sm:p-8 shadow-md">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            Admin Login
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center">
            Sign in to access <span className="font-mono">/admin/config</span>.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) handleLogin();
          }}
        >
          <div className="flex flex-col">
            <label className="block text-xs sm:text-sm mb-1 text-gray-700">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              className="w-full rounded-md bg-white border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-prayer-green"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-xs sm:text-sm mb-1 text-gray-700">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md bg-white border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-prayer-green"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 text-xs sm:text-sm font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-prayer-green focus:ring-offset-dark-background"
              onClick={() => navigate("/")}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center px-4 py-2 rounded-md bg-prayer-green text-white text-xs sm:text-sm font-semibold hover:bg-prayer-green/90 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-prayer-green focus:ring-offset-dark-background"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminAuthGate;


