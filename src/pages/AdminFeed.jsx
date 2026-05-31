import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import {
  FEED_STATUS_LABELS,
  categoryLabel,
  fetchAdminFeedItems,
  isCurrentUserFeedAdmin,
  isSupabaseConfigured,
  moderateFeedTarget,
} from "../lib/feed.js";

const STATUS_FILTERS = ["pending_review", "published", "rejected", "removed", "all"];

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const tone =
    status === "published"
      ? "bg-emerald-50 text-emerald-800"
      : status === "removed" || status === "rejected"
        ? "bg-red-50 text-red-800"
        : "bg-amber-50 text-amber-800";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {FEED_STATUS_LABELS[status] || status}
    </span>
  );
}

function AdminActions({ targetType, targetId, status, onAction, busy }) {
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "published" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction(targetType, targetId, "approve")}
          className="focus-ring rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          Approve
        </button>
      ) : null}
      {status !== "removed" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction(targetType, targetId, "remove")}
          className="focus-ring rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          Take down
        </button>
      ) : null}
      {status !== "rejected" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction(targetType, targetId, "reject")}
          className="focus-ring rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
        >
          Reject
        </button>
      ) : null}
      {status === "removed" || status === "rejected" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction(targetType, targetId, "restore")}
          className="focus-ring rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
        >
          Restore
        </button>
      ) : null}
    </div>
  );
}

export default function AdminFeed() {
  useDocumentTitle("Feed admin | Thuto");
  const { user, supabaseConfigured } = useAuth();
  const configured = supabaseConfigured && isSupabaseConfigured();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState({ posts: [], comments: [], reports: [] });
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [busyTarget, setBusyTarget] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadAdminItems() {
    setError("");
    try {
      setItems(await fetchAdminFeedItems());
    } catch (err) {
      setError(err.message || "Could not load admin feed.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function checkAccess() {
      setIsChecking(true);
      setError("");
      try {
        const admin = await isCurrentUserFeedAdmin();
        if (cancelled) return;
        setIsAdmin(admin);
        if (admin) {
          const nextItems = await fetchAdminFeedItems();
          if (!cancelled) setItems(nextItems);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not verify admin access.");
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    }
    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const postById = useMemo(() => {
    const map = new Map();
    for (const post of items.posts) map.set(post.id, post);
    return map;
  }, [items.posts]);

  const queueCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUS_FILTERS.map((status) => [status, 0]));
    for (const post of items.posts) {
      counts[post.status] = (counts[post.status] || 0) + 1;
      counts.all += 1;
    }
    for (const comment of items.comments) {
      counts[comment.status] = (counts[comment.status] || 0) + 1;
      counts.all += 1;
    }
    return counts;
  }, [items.posts, items.comments]);

  const visiblePosts = items.posts.filter((post) => statusFilter === "all" || post.status === statusFilter);
  const visibleComments = items.comments.filter((comment) => statusFilter === "all" || comment.status === statusFilter);

  async function handleAction(targetType, targetId, action) {
    const key = `${targetType}:${targetId}:${action}`;
    setBusyTarget(key);
    setError("");
    setNotice("");
    try {
      await moderateFeedTarget({
        targetType,
        targetId,
        action,
        adminNote: `Admin ${action} from Thuto feed panel.`,
      });
      setNotice("Feed item updated.");
      await loadAdminItems();
    } catch (err) {
      setError(err.message || "Could not update feed item.");
    } finally {
      setBusyTarget("");
    }
  }

  if (!configured) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-brand-900">Feed admin</h1>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Supabase must be configured before the feed admin panel can work.
        </p>
      </div>
    );
  }

  if (!user && !isChecking) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-brand-900">Feed admin</h1>
        <p className="rounded-2xl border border-brand-100 bg-white p-4 text-sm text-stone-600 shadow-sm">
          <Link to="/auth?mode=login" className="font-semibold text-brand-700 underline">
            Log in
          </Link>{" "}
          with an admin account to review feed posts.
        </p>
      </div>
    );
  }

  if (isChecking) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-brand-900">Feed admin</h1>
        <p className="rounded-2xl border border-brand-100 bg-white p-4 text-sm text-stone-500 shadow-sm">
          Checking admin access...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-brand-900">Feed admin</h1>
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          This account is not listed in feed_admins.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Admin moderation</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-900">Feed control room</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Review AI decisions, take down weak posts, restore safe content, and watch reports.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={[
              "focus-ring rounded-full px-3 py-2 text-xs font-semibold transition",
              statusFilter === status ? "bg-brand-700 text-white" : "border border-brand-100 bg-white text-brand-800 hover:bg-brand-50",
            ].join(" ")}
          >
            {status === "all" ? "All" : FEED_STATUS_LABELS[status] || status}
            <span className="ml-1 opacity-75">{queueCounts[status] || 0}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={loadAdminItems}
          className="focus-ring rounded-full border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
        >
          Refresh
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

      <section className="rounded-3xl border border-brand-100 bg-white p-4 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-brand-900">Recent reports</h2>
        {items.reports.length ? (
          <ul className="mt-3 grid gap-2">
            {items.reports.slice(0, 8).map((report) => (
              <li key={report.id} className="rounded-2xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
                <span className="font-semibold text-brand-900">{report.reason}</span> on {report.target_type}{" "}
                <span className="font-mono text-xs">{report.target_id}</span>
                {report.details ? <span className="block text-xs text-stone-500">{report.details}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No reports yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-brand-900">Posts</h2>
        {!visiblePosts.length ? (
          <p className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/60 p-6 text-center text-sm text-stone-600">
            No posts in this queue.
          </p>
        ) : null}
        {visiblePosts.map((post) => (
          <article key={post.id} className="rounded-3xl border border-brand-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={post.status} />
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                    {categoryLabel(post.category)}
                  </span>
                  {post.reportCount ? (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                      {post.reportCount} reports
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm font-semibold text-brand-950">{post.authorDisplayName}</p>
                <p className="mt-0.5 text-xs text-stone-500">{formatDate(post.updatedAt || post.createdAt)}</p>
              </div>
              <AdminActions
                targetType="post"
                targetId={post.id}
                status={post.status}
                onAction={handleAction}
                busy={busyTarget.startsWith(`post:${post.id}:`)}
              />
            </div>

            {post.title ? <h3 className="mt-4 font-display text-xl font-semibold text-brand-950">{post.title}</h3> : null}
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-700">{post.body}</p>
            {post.linkUrl ? <p className="mt-2 break-all text-xs font-semibold text-brand-700">{post.linkUrl}</p> : null}
            {post.images.length ? (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {post.images.map((image) => (
                  <img
                    key={image.id || image.publicUrl}
                    src={image.publicUrl}
                    alt={image.altText || "Feed attachment"}
                    className="h-24 w-28 shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            ) : null}
            <div className="mt-3 rounded-2xl bg-stone-50 p-3 text-xs leading-relaxed text-stone-600">
              <p>
                <span className="font-semibold text-stone-900">AI:</span> {post.moderationDecision || "n/a"}
                {post.moderationScore != null ? `, score ${post.moderationScore}` : ""}
              </p>
              <p className="mt-1">{post.moderationReason || "No moderation reason recorded."}</p>
              {post.adminNote ? <p className="mt-1">Admin note: {post.adminNote}</p> : null}
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-brand-900">Comments</h2>
        {!visibleComments.length ? (
          <p className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/60 p-6 text-center text-sm text-stone-600">
            No comments in this queue.
          </p>
        ) : null}
        {visibleComments.map((comment) => {
          const post = postById.get(comment.post_id);
          return (
            <article key={comment.id} className="rounded-3xl border border-brand-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <StatusBadge status={comment.status} />
                  <p className="mt-3 text-sm font-semibold text-brand-950">{comment.author_display_name || "Student"}</p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    On: {post?.title || post?.body?.slice(0, 80) || comment.post_id}
                  </p>
                </div>
                <AdminActions
                  targetType="comment"
                  targetId={comment.id}
                  status={comment.status}
                  onAction={handleAction}
                  busy={busyTarget.startsWith(`comment:${comment.id}:`)}
                />
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-700">{comment.body}</p>
              <div className="mt-3 rounded-2xl bg-stone-50 p-3 text-xs leading-relaxed text-stone-600">
                <p>{comment.moderation_reason || "No moderation reason recorded."}</p>
                {comment.report_count ? <p className="mt-1">{comment.report_count} reports</p> : null}
                {comment.admin_note ? <p className="mt-1">Admin note: {comment.admin_note}</p> : null}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
