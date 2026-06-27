import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";

export default function DeleteAccountForm() {
  const { deleteAccount, user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const confirmationReady = confirmText.trim().toUpperCase() === "DELETE";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!confirmationReady) {
      setError('Type "DELETE" to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount({ password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete your account.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-xl border border-red-200 bg-white px-3 py-3 text-sm text-red-900">
        <p className="font-semibold">This action is permanent.</p>
        <p className="mt-1 leading-relaxed text-red-800/90">
          Your profile, saved programmes, predictor snapshot, feed posts, messages, and billing access tied to{" "}
          <span className="font-medium">{user?.email}</span> will be removed and cannot be recovered.
        </p>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-stone-600">Confirm with your password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          disabled={isDeleting}
          className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-stone-600">Type DELETE to confirm</span>
        <input
          type="text"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          required
          disabled={isDeleting}
          className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
        />
      </label>

      <button
        type="submit"
        disabled={isDeleting || !confirmationReady || !password}
        className="focus-ring inline-flex min-h-10 items-center justify-center rounded-xl border border-red-300 bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDeleting ? "Deleting account..." : "Delete account permanently"}
      </button>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
