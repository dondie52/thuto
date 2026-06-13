import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  notificationSummary,
} from "../lib/notifications.js";

function profileInitial(name) {
  const letter = String(name || "S")
    .trim()
    .charAt(0)
    .toUpperCase();
  return letter || "S";
}

function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function FeedNotifications() {
  useDocumentTitle("Notifications | Thuto");
  const { user, supabaseConfigured } = useAuth();
  const { reloadBadges } = useOutletContext() || {};
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      setItems(await fetchNotifications());
    } catch (err) {
      setError(err.message || "Could not load notifications.");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function handleOpen(item) {
    if (!item.readAt) {
      try {
        await markNotificationsRead([item.id]);
        setItems((current) =>
          current.map((row) => (row.id === item.id ? { ...row, readAt: new Date().toISOString() } : row)),
        );
        reloadBadges?.();
      } catch {
        // ignore read errors
      }
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setItems((current) => current.map((row) => ({ ...row, readAt: row.readAt || new Date().toISOString() })));
      reloadBadges?.();
    } catch (err) {
      setError(err.message || "Could not mark notifications as read.");
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="px-4 pt-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Notifications need Supabase to be configured on this build.
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-3 px-4 pt-2">
        <h1 className="font-display text-xl font-semibold text-brand-900">Notifications</h1>
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
          <Link to="/auth?mode=login&next=%2Ffeed%2Fnotifications" className="font-semibold underline">
            Sign in
          </Link>{" "}
          to see follows, mentions, and post updates.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-brand-900">Notifications</h1>
          <p className="mt-1 text-sm text-stone-600">Follows, tags, reactions, and connection requests.</p>
        </div>
        {items.some((item) => !item.readAt) ? (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="focus-ring rounded-full border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? <p className="text-sm text-stone-500">Loading notifications...</p> : null}

      {!isLoading && !items.length ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-stone-600">
          You are all caught up. Follow people on the{" "}
          <Link to="/feed/people" className="font-semibold text-brand-800 underline">
            People
          </Link>{" "}
          tab to see updates here.
        </div>
      ) : null}

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleOpen(item)}
            className={[
              "focus-ring flex w-full items-start gap-3 rounded-2xl border p-3 text-left shadow-sm",
              item.readAt ? "border-brand-100 bg-white" : "border-brand-200 bg-brand-50/70",
            ].join(" ")}
          >
            {item.actorAvatarUrl ? (
              <img src={item.actorAvatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                {profileInitial(item.actorName)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-brand-900">{notificationSummary(item)}</p>
              <p className="mt-1 text-xs text-stone-500">{formatWhen(item.createdAt)}</p>
            </div>
            {!item.readAt ? <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" aria-hidden /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
