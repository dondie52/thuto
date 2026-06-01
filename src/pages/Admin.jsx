import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import {
  deleteOpportunityPost,
  fetchAdminOverview,
  isCurrentUserFeedAdmin,
  isSupabaseConfigured,
  saveOpportunityPost,
  setOpportunityPublished,
  updateProfilePremium,
} from "../lib/admin.js";
import { FEED_CATEGORIES, FEED_STATUS_LABELS, categoryLabel, moderateFeedTarget, submitFeedPost } from "../lib/feed.js";
import { useAuth } from "../lib/auth.jsx";

const CONTROL_LINKS = [
  { to: "/admin/feed", label: "Feed moderation", description: "Approve, reject, remove, restore, and review reports." },
  { to: "/programmes", label: "Programme catalogue", description: "Inspect programme data exactly as students see it." },
  { to: "/universities", label: "Universities", description: "Check institution pages, resources, and application windows." },
  { to: "/sponsorships", label: "Sponsorships", description: "Review public sponsorship cards from live opportunity data." },
  { to: "/internships", label: "Internships", description: "Review internship cards from live opportunity data." },
  { to: "/settings", label: "Settings", description: "Open account settings for the current operator." },
];

const EMPTY_OPPORTUNITY = {
  category: "private_sponsorship",
  sponsor: "",
  title: "",
  body: "",
  imageUrl: "",
  sourceUrl: "",
  expiresAt: "",
  sortOrder: 0,
  published: true,
};

const EMPTY_OFFICIAL_POST = {
  category: "notice",
  title: "",
  body: "",
  linkUrl: "",
};

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function Stat({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-brand-950">{value}</p>
      {detail ? <p className="mt-1 text-sm text-stone-600">{detail}</p> : null}
    </div>
  );
}

function StatusPill({ status }) {
  const tone =
    status === "published"
      ? "bg-emerald-50 text-emerald-800"
      : status === "removed" || status === "rejected"
        ? "bg-red-50 text-red-800"
        : "bg-amber-50 text-amber-800";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{FEED_STATUS_LABELS[status] || status}</span>;
}

export default function Admin() {
  useDocumentTitle("Admin | Thuto");
  const { user, supabaseConfigured } = useAuth();
  const configured = supabaseConfigured && isSupabaseConfigured();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [overview, setOverview] = useState(null);
  const [busyTarget, setBusyTarget] = useState("");
  const [officialPostForm, setOfficialPostForm] = useState(EMPTY_OFFICIAL_POST);
  const [opportunityForm, setOpportunityForm] = useState(EMPTY_OPPORTUNITY);
  const [editingOpportunityId, setEditingOpportunityId] = useState("");
  const [premiumEdits, setPremiumEdits] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadOverview() {
    setError("");
    try {
      setOverview(await fetchAdminOverview());
    } catch (err) {
      setError(err.message || "Could not load admin overview.");
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
        if (admin) await loadOverview();
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

  const reviewQueue = useMemo(() => {
    if (!overview) return [];
    const posts = overview.feed.posts
      .filter((post) => post.status === "pending_review" || post.reportCount > 0)
      .map((post) => ({ type: "post", item: post, updatedAt: post.updatedAt || post.createdAt }));
    const comments = overview.feed.comments
      .filter((comment) => comment.status === "pending_review" || Number(comment.report_count || 0) > 0)
      .map((comment) => ({ type: "comment", item: comment, updatedAt: comment.updated_at || comment.created_at }));
    return [...posts, ...comments]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 6);
  }, [overview]);

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
        adminNote: `Admin ${action} from Thuto admin dashboard.`,
      });
      setNotice("Admin action saved.");
      await loadOverview();
    } catch (err) {
      setError(err.message || "Could not update item.");
    } finally {
      setBusyTarget("");
    }
  }

  async function handleOfficialPost(event) {
    event.preventDefault();
    setBusyTarget("official-post:save");
    setError("");
    setNotice("");
    try {
      const result = await submitFeedPost({
        category: officialPostForm.category,
        title: officialPostForm.title,
        body: officialPostForm.body,
        linkUrl: officialPostForm.linkUrl,
        imageFiles: [],
      });
      setNotice(result.post?.status === "published" ? "Official post published." : "Official post submitted for review.");
      setOfficialPostForm(EMPTY_OFFICIAL_POST);
      await loadOverview();
    } catch (err) {
      setError(err.message || "Could not publish official post.");
    } finally {
      setBusyTarget("");
    }
  }

  function resetOpportunityForm() {
    setEditingOpportunityId("");
    setOpportunityForm(EMPTY_OPPORTUNITY);
  }

  function editOpportunity(post) {
    setEditingOpportunityId(post.id);
    setOpportunityForm({
      category: post.category || "private_sponsorship",
      sponsor: post.sponsor || "",
      title: post.title || "",
      body: post.body || "",
      imageUrl: post.image_url || "",
      sourceUrl: post.source_url || "",
      expiresAt: post.expires_at ? post.expires_at.slice(0, 10) : "",
      sortOrder: post.sort_order || 0,
      published: Boolean(post.published),
    });
  }

  async function handleSaveOpportunity(event) {
    event.preventDefault();
    setBusyTarget("opportunity:save");
    setError("");
    setNotice("");
    try {
      await saveOpportunityPost({
        id: editingOpportunityId || undefined,
        ...opportunityForm,
        expiresAt: opportunityForm.expiresAt ? `${opportunityForm.expiresAt}T23:59:59.000Z` : null,
      });
      setNotice(editingOpportunityId ? "Opportunity updated." : "Opportunity created.");
      resetOpportunityForm();
      await loadOverview();
    } catch (err) {
      setError(err.message || "Could not save opportunity.");
    } finally {
      setBusyTarget("");
    }
  }

  async function handleOpportunityPublish(id, published) {
    setBusyTarget(`opportunity:${id}:publish`);
    setError("");
    setNotice("");
    try {
      await setOpportunityPublished(id, published);
      setNotice(published ? "Opportunity published." : "Opportunity unpublished.");
      await loadOverview();
    } catch (err) {
      setError(err.message || "Could not update opportunity.");
    } finally {
      setBusyTarget("");
    }
  }

  async function handleDeleteOpportunity(id) {
    setBusyTarget(`opportunity:${id}:delete`);
    setError("");
    setNotice("");
    try {
      await deleteOpportunityPost(id);
      setNotice("Opportunity deleted.");
      if (editingOpportunityId === id) resetOpportunityForm();
      await loadOverview();
    } catch (err) {
      setError(err.message || "Could not delete opportunity.");
    } finally {
      setBusyTarget("");
    }
  }

  async function handlePremiumSave(profile) {
    const edit = premiumEdits[profile.id] || {};
    setBusyTarget(`profile:${profile.id}:premium`);
    setError("");
    setNotice("");
    try {
      await updateProfilePremium({
        id: profile.id,
        premiumStatus: edit.premiumStatus || profile.premium_status || "free",
        premiumPlan: edit.premiumPlan ?? profile.premium_plan ?? "",
        premiumUntil: edit.premiumUntil ?? (profile.premium_until ? profile.premium_until.slice(0, 10) : ""),
      });
      setNotice("Profile premium status updated.");
      await loadOverview();
    } catch (err) {
      setError(err.message || "Could not update premium status.");
    } finally {
      setBusyTarget("");
    }
  }

  if (!configured) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-brand-900">Admin</h1>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Supabase must be configured before live admin controls can work.
        </p>
      </div>
    );
  }

  if (!user && !isChecking) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-brand-900">Admin</h1>
        <p className="rounded-2xl border border-brand-100 bg-white p-4 text-sm text-stone-600 shadow-sm">
          <Link to="/auth?mode=login" className="font-semibold text-brand-700 underline">
            Log in
          </Link>{" "}
          with an admin account to control Thuto.
        </p>
      </div>
    );
  }

  if (isChecking) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-brand-900">Admin</h1>
        <p className="rounded-2xl border border-brand-100 bg-white p-4 text-sm text-stone-500 shadow-sm">
          Checking admin access...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-brand-900">Admin</h1>
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          This account is not listed in feed_admins.
        </p>
      </div>
    );
  }

  const localData = overview?.localData;
  const counts = overview?.counts || {};

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Thuto admin</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-brand-950">Control room</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
            Run moderation, inspect live operations, and jump into the main surfaces from one admin page.
          </p>
        </div>
        <button
          type="button"
          onClick={loadOverview}
          className="focus-ring rounded-xl border border-brand-100 bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm hover:bg-brand-50"
        >
          Refresh
        </button>
      </header>

      {notice ? <p className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900">{notice}</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {overview?.warnings?.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {overview.warnings.slice(0, 3).map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Needs review" value={counts.pendingFeed || 0} detail={`${counts.reports || 0} recent reports`} />
        <Stat label="Readable profiles" value={counts.profiles ?? 0} detail={`${counts.premiumProfiles ?? 0} premium profiles`} />
        <Stat label="Opportunities" value={counts.opportunities ?? 0} detail="Sponsorship and internship rows" />
        <Stat label="Programmes" value={localData?.programmesTotal ?? 0} detail={`${localData?.programmesMissingMinPoints ?? 0} missing points`} />
        <Stat label="Institutions" value={localData?.universitiesTotal ?? 0} detail={`${localData?.universitiesWithResources ?? 0} with resources`} />
        <Stat label="Application dates" value={localData?.universitiesWithOpenDates ?? 0} detail="Universities with window data" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {CONTROL_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="focus-ring rounded-2xl border border-brand-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-50"
          >
            <p className="font-display text-lg font-semibold text-brand-950">{link.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{link.description}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-3xl border border-brand-100 bg-white p-4 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-brand-950">Official feed post</h2>
        <form onSubmit={handleOfficialPost} className="mt-3 grid gap-3 rounded-2xl bg-stone-50 p-3">
          <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Category
              <select
                value={officialPostForm.category}
                onChange={(event) => setOfficialPostForm((form) => ({ ...form, category: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              >
                {FEED_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Title
              <input
                value={officialPostForm.title}
                onChange={(event) => setOfficialPostForm((form) => ({ ...form, title: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              />
            </label>
          </div>
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Body
            <textarea
              required
              rows={4}
              value={officialPostForm.body}
              onChange={(event) => setOfficialPostForm((form) => ({ ...form, body: event.target.value }))}
              className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Link URL
              <input
                type="url"
                value={officialPostForm.linkUrl}
                onChange={(event) => setOfficialPostForm((form) => ({ ...form, linkUrl: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              />
            </label>
            <button
              type="submit"
              disabled={busyTarget === "official-post:save"}
              className="focus-ring self-end rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              Publish
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-brand-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-brand-950">Fast moderation</h2>
          <Link to="/admin/feed" className="text-sm font-semibold text-brand-700 underline">
            Open full feed panel
          </Link>
        </div>
        {!reviewQueue.length ? <p className="mt-3 text-sm text-stone-500">No urgent feed items right now.</p> : null}
        <div className="mt-3 grid gap-3">
          {reviewQueue.map(({ type, item }) => {
            const id = item.id;
            const status = item.status;
            const reportCount = type === "post" ? item.reportCount : Number(item.report_count || 0);
            const body = item.body;
            return (
              <article key={`${type}:${id}`} className="rounded-2xl bg-stone-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={status} />
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800">
                    {type === "post" ? categoryLabel(item.category) : "Comment"}
                  </span>
                  {reportCount ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{reportCount} reports</span> : null}
                </div>
                <p className="mt-3 max-h-20 overflow-hidden text-sm leading-relaxed text-stone-700">{body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyTarget.startsWith(`${type}:${id}:`)}
                    onClick={() => handleAction(type, id, "approve")}
                    className="focus-ring rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyTarget.startsWith(`${type}:${id}:`)}
                    onClick={() => handleAction(type, id, "remove")}
                    className="focus-ring rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    Take down
                  </button>
                  <button
                    type="button"
                    disabled={busyTarget.startsWith(`${type}:${id}:`)}
                    onClick={() => handleAction(type, id, "reject")}
                    className="focus-ring rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-brand-100 bg-white p-4 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-brand-950">Latest opportunities</h2>
        <form onSubmit={handleSaveOpportunity} className="mt-3 grid gap-3 rounded-2xl bg-stone-50 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Category
              <select
                value={opportunityForm.category}
                onChange={(event) => setOpportunityForm((form) => ({ ...form, category: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              >
                <option value="private_sponsorship">Private sponsorship</option>
                <option value="internship">Internship</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Sponsor
              <input
                value={opportunityForm.sponsor}
                onChange={(event) => setOpportunityForm((form) => ({ ...form, sponsor: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              />
            </label>
          </div>
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Title
            <input
              required
              value={opportunityForm.title}
              onChange={(event) => setOpportunityForm((form) => ({ ...form, title: event.target.value }))}
              className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Body
            <textarea
              required
              rows={3}
              value={opportunityForm.body}
              onChange={(event) => setOpportunityForm((form) => ({ ...form, body: event.target.value }))}
              className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Source URL
              <input
                type="url"
                value={opportunityForm.sourceUrl}
                onChange={(event) => setOpportunityForm((form) => ({ ...form, sourceUrl: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Image URL
              <input
                type="url"
                value={opportunityForm.imageUrl}
                onChange={(event) => setOpportunityForm((form) => ({ ...form, imageUrl: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem_auto_auto]">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Expires
              <input
                type="date"
                value={opportunityForm.expiresAt}
                onChange={(event) => setOpportunityForm((form) => ({ ...form, expiresAt: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Sort
              <input
                type="number"
                value={opportunityForm.sortOrder}
                onChange={(event) => setOpportunityForm((form) => ({ ...form, sortOrder: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              />
            </label>
            <label className="flex items-center gap-2 self-end rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-semibold text-brand-900">
              <input
                type="checkbox"
                checked={opportunityForm.published}
                onChange={(event) => setOpportunityForm((form) => ({ ...form, published: event.target.checked }))}
              />
              Published
            </label>
            <div className="flex gap-2 self-end">
              <button
                type="submit"
                disabled={busyTarget === "opportunity:save"}
                className="focus-ring rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
              >
                {editingOpportunityId ? "Update" : "Create"}
              </button>
              {editingOpportunityId ? (
                <button
                  type="button"
                  onClick={resetOpportunityForm}
                  className="focus-ring rounded-xl border border-brand-100 bg-white px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  New
                </button>
              ) : null}
            </div>
          </div>
        </form>

        {overview?.opportunities?.length ? (
          <div className="mt-3 grid gap-2">
            {overview.opportunities.map((post) => (
              <div key={post.id} className="rounded-2xl bg-stone-50 px-3 py-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-brand-950">{post.title}</p>
                    <p className="text-xs text-stone-500">
                      {post.category} / {post.sponsor || "No sponsor"} / expires {formatDate(post.expires_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => editOpportunity(post)}
                      className="focus-ring rounded-lg border border-brand-100 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busyTarget.startsWith(`opportunity:${post.id}:`)}
                      onClick={() => handleOpportunityPublish(post.id, !post.published)}
                      className="focus-ring rounded-lg border border-brand-100 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
                    >
                      {post.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      disabled={busyTarget.startsWith(`opportunity:${post.id}:`)}
                      onClick={() => handleDeleteOpportunity(post.id)}
                      className="focus-ring rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-xs text-stone-500">
                  {post.published ? "Published" : "Draft"} / sort {post.sort_order || 0}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No readable opportunity rows.</p>
        )}
      </section>

      <section className="rounded-3xl border border-brand-100 bg-white p-4 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-brand-950">Premium profiles</h2>
        {overview?.profiles?.length ? (
          <div className="mt-3 grid gap-2">
            {overview.profiles.map((profile) => {
              const edit = premiumEdits[profile.id] || {};
              return (
                <div key={profile.id} className="rounded-2xl bg-stone-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-brand-950">{profile.full_name || "Unnamed student"}</p>
                      <p className="text-xs text-stone-500">{profile.university_name || profile.id}</p>
                    </div>
                    <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[8rem_8rem_9rem_auto]">
                      <select
                        value={edit.premiumStatus ?? profile.premium_status ?? "free"}
                        onChange={(event) =>
                          setPremiumEdits((edits) => ({
                            ...edits,
                            [profile.id]: { ...edits[profile.id], premiumStatus: event.target.value },
                          }))
                        }
                        className="focus-ring rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium text-stone-800"
                      >
                        <option value="free">Free</option>
                        <option value="active">Active</option>
                        <option value="past_due">Past due</option>
                        <option value="canceled">Canceled</option>
                      </select>
                      <select
                        value={edit.premiumPlan ?? profile.premium_plan ?? ""}
                        onChange={(event) =>
                          setPremiumEdits((edits) => ({
                            ...edits,
                            [profile.id]: { ...edits[profile.id], premiumPlan: event.target.value },
                          }))
                        }
                        className="focus-ring rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium text-stone-800"
                      >
                        <option value="">No plan</option>
                        <option value="season_pass">Season</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </select>
                      <input
                        type="date"
                        value={edit.premiumUntil ?? (profile.premium_until ? profile.premium_until.slice(0, 10) : "")}
                        onChange={(event) =>
                          setPremiumEdits((edits) => ({
                            ...edits,
                            [profile.id]: { ...edits[profile.id], premiumUntil: event.target.value },
                          }))
                        }
                        className="focus-ring rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium text-stone-800"
                      />
                      <button
                        type="button"
                        disabled={busyTarget === `profile:${profile.id}:premium`}
                        onClick={() => handlePremiumSave(profile)}
                        className="focus-ring rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No readable profiles yet.</p>
        )}
      </section>
    </div>
  );
}
