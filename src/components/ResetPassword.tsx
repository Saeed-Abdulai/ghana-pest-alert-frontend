import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // When user clicks the email link, Supabase returns with a recovery session.
    // We just confirm there's a session available.
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setErr(error.message);
        return;
      }
      if (!data.session) {
        setErr("No recovery session found. Please request a new password reset link.");
        return;
      }
      setReady(true);
    })();
  }, []);

  const handleSave = async () => {
    setErr(null);
    setMsg(null);

    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErr(error.message);
        return;
      }
      setMsg("Password updated successfully. You can now sign in with your new password.");
      // Optional: redirect to home/login after a short moment
      // window.location.href = "/";
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-bold text-gray-900">Reset Password</h1>
        <p className="text-sm text-gray-600 mt-1">
          Set a new password for your account.
        </p>

        {err && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {err}
          </div>
        )}

        {msg && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            {msg}
          </div>
        )}

        {!ready ? (
          <div className="mt-6 text-sm text-gray-600">Preparing reset session…</div>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Update Password"}
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
