import { Link } from "react-router-dom";
import { formatAuthProviderLabel, getAuthProvider } from "../../lib/authRedirect.js";

function formatTimestamp(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * @param {{ user: import("@supabase/supabase-js").User | null, unreadCount?: number }} props
 */
export default function AccountActivitySummary({ user, unreadCount = 0 }) {
  return (
    <div className="space-y-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Account created</dt>
          <dd className="mt-1 font-semibold text-brand-900">{formatTimestamp(user?.created_at)}</dd>
        </div>
        <div className="rounded-xl border border-brand-100 bg-white px-3 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Last sign-in</dt>
          <dd className="mt-1 font-semibold text-brand-900">{formatTimestamp(user?.last_sign_in_at)}</dd>
        </div>
        <div className="rounded-xl border border-brand-100 bg-white px-3 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Sign-in method</dt>
          <dd className="mt-1 font-semibold text-brand-900">{formatAuthProviderLabel(getAuthProvider(user))}</dd>
        </div>
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Unread notifications</dt>
          <dd className="mt-1 font-semibold text-brand-900">{unreadCount}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/feed/notifications"
          className="focus-ring inline-flex rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
        >
          View recent activity
        </Link>
        <Link
          to="/settings"
          className="focus-ring inline-flex rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
        >
          Device data settings
        </Link>
      </div>
    </div>
  );
}
