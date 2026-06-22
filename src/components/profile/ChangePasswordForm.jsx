import { useState } from "react";
import { useAuth } from "../../lib/auth.jsx";

export default function ChangePasswordForm() {
  const { changePassword, requestPasswordReset, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResetRequest() {
    if (!user?.email) return;
    setError("");
    setNotice("");
    setIsResetting(true);
    try {
      await requestPasswordReset(user.email);
      setNotice("Password reset link sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-xs font-semibold text-stone-600">Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
            disabled={isSaving}
            className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-stone-600">New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            disabled={isSaving}
            className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-stone-600">Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            disabled={isSaving}
            className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={isSaving}
          className="focus-ring inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:opacity-60"
        >
          {isSaving ? "Updating..." : "Change password"}
        </button>
      </form>

      <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-3">
        <p className="text-sm font-semibold text-brand-900">Forgot your password?</p>
        <p className="mt-1 text-xs text-stone-600">
          We can email a reset link to <span className="font-medium">{user?.email}</span>.
        </p>
        <button
          type="button"
          onClick={handleResetRequest}
          disabled={isResetting}
          className="focus-ring mt-3 rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
        >
          {isResetting ? "Sending..." : "Email reset link"}
        </button>
      </div>

      {notice ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
