import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import {
  deleteOpportunityPost,
  fetchAdminOverview,
  isSupabaseConfigured,
  saveOpportunityPost,
  setOpportunityPublished,
  uploadOpportunityImage,
  updateProfilePremium,
} from "../lib/admin.js";
import { FEED_CATEGORIES, FEED_STATUS_LABELS, categoryLabel, moderateFeedTarget, submitFeedPost } from "../lib/feed.js";
import { useAuth } from "../lib/auth.jsx";
import {
  deleteProgrammeOverride,
  deleteUniversityOverride,
  deletePageSection,
  fetchPageContent,
  saveProgrammeOverride,
  savePageSection,
  saveUniversityOverride,
  uploadContentAsset,
} from "../lib/contentManagement.js";
import { fetchProgrammes } from "../lib/programmesData.js";
import { fetchUniversities } from "../lib/universitiesData.js";
import { PAGE_CONTENT_DEFAULTS, PAGE_CONTENT_META } from "../lib/pageContentDefaults.js";
import {
  fetchSupportFeedback,
  isSupportFeedbackUnavailableError,
  updateSupportFeedbackStatus,
} from "../lib/supportFeedback.js";
import {
  fetchPartnerInquiries,
  isPartnerInquiriesUnavailableError,
  updatePartnerInquiryStatus,
} from "../lib/partnerInquiries.js";
import { safeExternalUrl, isAllowedExternalResourceUrl } from "../lib/urlSafety.js";

const ADMIN_TABS = [
  { key: "overview", label: "Overview" },
  { key: "catalog", label: "Catalogue" },
  { key: "pages", label: "Page content" },
  { key: "opportunities", label: "Opportunities" },
  { key: "feedback", label: "Feedback" },
  { key: "partners", label: "Partners" },
  { key: "premium", label: "Premium" },
];

const CONTROL_LINKS = [
  { to: "/admin/feed", label: "Feed moderation", description: "Approve, reject, remove, restore, and review reports." },
  { to: "/admin/center", label: "Thuto Center moderation", description: "Review student uploads, approve unlock credits, and handle copyright reports." },
  { to: "/programmes", label: "Programme catalogue", description: "Inspect programme data exactly as students see it." },
  { to: "/universities", label: "Universities", description: "Check institution pages, resources, and application windows." },
  { to: "/sponsorships", label: "Sponsorships", description: "Review public sponsorship cards from live opportunity data." },
  { to: "/partners", label: "Partners page", description: "Review the public partner marketing page and inquiry form." },
  { to: "/postgraduate-studies", label: "Postgraduate Studies", description: "Review postgraduate programmes hub and scholarship posts." },
  { to: "/feed", label: "Community feed", description: "Review the live feed where internship posts can appear as community content." },
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

const EMPTY_UNIVERSITY_FORM = {
  id: "",
  name: "",
  location: "",
  description: "",
  website: "",
  phone: "",
  applicationOpen: "",
  applicationClose: "",
  applyUrl: "",
  campusPhoto: "",
  resourcesJson: "[]",
  studentIncentivesJson: "[]",
  published: true,
};

const EMPTY_PROGRAMME_FORM = {
  id: "",
  name: "",
  university: "",
  universityShort: "",
  field: "",
  faculty: "",
  minPoints: "",
  duration: "",
  description: "",
  officialUrl: "",
  applyUrl: "",
  applicationDeadline: "",
  coverImage: "",
  careers: "",
  tags: "",
  modulesJson: "[]",
  published: true,
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

function toJson(value, fallback = "[]") {
  try {
    return JSON.stringify(value || [], null, 2);
  } catch {
    return fallback;
  }
}

function parseJsonArray(value, label) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return [];
  const parsed = JSON.parse(trimmed);
  if (!Array.isArray(parsed)) throw new Error(`${label} must be a JSON array.`);
  return parsed;
}

function csvList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function selectedFile(event) {
  return event.target.files?.[0] || null;
}

function labelize(key) {
  return String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function emptyLike(value) {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, emptyLike(child)]));
  }
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return 0;
  return "";
}

function isStatArray(key, value) {
  return (
    Array.isArray(value) &&
    key === "stats" &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        Object.prototype.hasOwnProperty.call(item, "value") &&
        Object.prototype.hasOwnProperty.call(item, "label"),
    )
  );
}

function StructuredContentFields({ value, onChange, depth = 0 }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  return (
    <div className={depth ? "grid gap-3 rounded-xl border border-stone-200 bg-white/80 p-3" : "grid gap-3"}>
      {Object.entries(value).map(([key, field]) => {
        const update = (nextValue) => onChange({ ...value, [key]: nextValue });
        if (Array.isArray(field)) {
          if (isStatArray(key, field)) {
            return (
              <div key={key} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{labelize(key)}</p>
                    <p className="mt-1 text-xs normal-case tracking-normal text-stone-500">
                      Edit the landing hero stat cards shown over the hero image.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => update([...field, { value: "", label: "" }])}
                    className="focus-ring rounded-lg border border-brand-100 bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-800"
                  >
                    Add stat
                  </button>
                </div>
                <div className="grid gap-3">
                  {field.map((item, index) => (
                    <div key={`${key}-${index}`} className="grid gap-3 rounded-xl bg-stone-50 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Value
                        <input
                          value={item.value || ""}
                          onChange={(event) =>
                            update(field.map((current, itemIndex) => (itemIndex === index ? { ...current, value: event.target.value } : current)))
                          }
                          className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                        />
                      </label>
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Label
                        <input
                          value={item.label || ""}
                          onChange={(event) =>
                            update(field.map((current, itemIndex) => (itemIndex === index ? { ...current, label: event.target.value } : current)))
                          }
                          className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => update(field.filter((_, itemIndex) => itemIndex !== index))}
                        className="focus-ring rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          const primitiveArray = field.every((item) => item == null || typeof item !== "object");
          return (
            <div key={key} className="grid gap-2 rounded-xl border border-stone-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{labelize(key)}</p>
                {!primitiveArray ? (
                  <button
                    type="button"
                    onClick={() => update([...field, emptyLike(field[0] || {})])}
                    className="focus-ring rounded-lg border border-brand-100 bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-800"
                  >
                    Add item
                  </button>
                ) : null}
              </div>
              {primitiveArray ? (
                <textarea
                  rows={Math.max(3, field.length)}
                  value={field.join("\n")}
                  onChange={(event) =>
                    update(
                      event.target.value
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean),
                    )
                  }
                  className="focus-ring w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm text-stone-800"
                />
              ) : (
                <div className="grid gap-3">
                  {field.map((item, index) => (
                    <div key={`${key}-${index}`} className="grid gap-2 rounded-xl bg-stone-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-stone-500">Item {index + 1}</p>
                        <button
                          type="button"
                          onClick={() => update(field.filter((_, itemIndex) => itemIndex !== index))}
                          className="focus-ring rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <StructuredContentFields
                        value={item}
                        depth={depth + 1}
                        onChange={(nextItem) => update(field.map((current, itemIndex) => (itemIndex === index ? nextItem : current)))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (field && typeof field === "object") {
          return (
            <fieldset key={key} className="grid gap-2 rounded-xl border border-stone-200 bg-white p-3">
              <legend className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{labelize(key)}</legend>
              <StructuredContentFields value={field} depth={depth + 1} onChange={update} />
            </fieldset>
          );
        }

        if (typeof field === "boolean") {
          return (
            <label key={key} className="flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-semibold text-brand-900">
              <input type="checkbox" checked={field} onChange={(event) => update(event.target.checked)} />
              {labelize(key)}
            </label>
          );
        }

        if (typeof field === "number") {
          return (
            <label key={key} className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              {labelize(key)}
              <input
                type="number"
                value={field}
                onChange={(event) => update(Number(event.target.value || 0))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              />
            </label>
          );
        }

        return (
          <label key={key} className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            {labelize(key)}
            {String(field || "").length > 90 || /body|paragraph|intro|note|description/i.test(key) ? (
              <textarea
                rows={3}
                value={field || ""}
                onChange={(event) => update(event.target.value)}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              />
            ) : (
              <input
                value={field || ""}
                onChange={(event) => update(event.target.value)}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

export default function Admin() {
  useDocumentTitle("Superuser | Thuto");
  const { isLoading, isSuperuser, isSuperuserLoading, supabaseConfigured, user } = useAuth();
  const configured = supabaseConfigured && isSupabaseConfigured();
  const [overview, setOverview] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [busyTarget, setBusyTarget] = useState("");
  const [officialPostForm, setOfficialPostForm] = useState(EMPTY_OFFICIAL_POST);
  const [opportunityForm, setOpportunityForm] = useState(EMPTY_OPPORTUNITY);
  const [contentUniversities, setContentUniversities] = useState([]);
  const [contentProgrammes, setContentProgrammes] = useState([]);
  const [pageContentRows, setPageContentRows] = useState([]);
  const [pageContentPageKey, setPageContentPageKey] = useState(PAGE_CONTENT_META[0].pageKey);
  const [pageContentSectionKey, setPageContentSectionKey] = useState("hero");
  const [pageContentForm, setPageContentForm] = useState(PAGE_CONTENT_DEFAULTS.landing.hero);
  const [pageContentPublished, setPageContentPublished] = useState(true);
  const [pageContentSortOrder, setPageContentSortOrder] = useState(0);
  const [feedbackRows, setFeedbackRows] = useState([]);
  const [feedbackLoaded, setFeedbackLoaded] = useState(false);
  const [feedbackWarning, setFeedbackWarning] = useState("");
  const [partnerInquiryRows, setPartnerInquiryRows] = useState([]);
  const [partnerInquiriesLoaded, setPartnerInquiriesLoaded] = useState(false);
  const [partnerInquiriesWarning, setPartnerInquiriesWarning] = useState("");
  const [universityForm, setUniversityForm] = useState(EMPTY_UNIVERSITY_FORM);
  const [programmeForm, setProgrammeForm] = useState(EMPTY_PROGRAMME_FORM);
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

  async function loadContentCatalog() {
    const [universitiesResult, programmes] = await Promise.all([
      fetchUniversities({ includeDrafts: true, includeAllCountries: true }),
      fetchProgrammes({ includeDrafts: true, includeAllCountries: true }),
    ]);
    setContentUniversities(universitiesResult.list);
    setContentProgrammes(programmes);
  }

  function hydratePageContentForm(nextPageKey, nextSectionKey, rows = pageContentRows) {
    const pageDefaults = PAGE_CONTENT_DEFAULTS[nextPageKey] || {};
    const sectionDefaults = pageDefaults[nextSectionKey] || {};
    const row = rows.find((item) => item.section_key === nextSectionKey);
    setPageContentPageKey(nextPageKey);
    setPageContentSectionKey(nextSectionKey);
    setPageContentForm({ ...sectionDefaults, ...(row?.content || {}) });
    setPageContentPublished(row ? Boolean(row.published) : true);
    setPageContentSortOrder(row?.sort_order || 0);
  }

  async function loadPageContentEditor(nextPageKey = pageContentPageKey) {
    const rows = await fetchPageContent(nextPageKey, { includeDrafts: true });
    setPageContentRows(rows);
    const pageDefaults = PAGE_CONTENT_DEFAULTS[nextPageKey] || {};
    const currentSection = pageDefaults[pageContentSectionKey] ? pageContentSectionKey : Object.keys(pageDefaults)[0];
    hydratePageContentForm(nextPageKey, currentSection, rows);
  }

  async function loadFeedbackRows() {
    setFeedbackWarning("");
    try {
      setFeedbackRows(await fetchSupportFeedback({ limit: 40 }));
    } catch (err) {
      if (isSupportFeedbackUnavailableError(err)) {
        setFeedbackRows([]);
        setError("");
        setFeedbackWarning(err.message || "Support feedback is unavailable in this Supabase project right now.");
        return;
      }
      setError(err.message || "Could not load support feedback.");
    } finally {
      setFeedbackLoaded(true);
    }
  }

  async function loadPartnerInquiryRows() {
    setPartnerInquiriesWarning("");
    try {
      setPartnerInquiryRows(await fetchPartnerInquiries({ limit: 40 }));
    } catch (err) {
      if (isPartnerInquiriesUnavailableError(err)) {
        setPartnerInquiryRows([]);
        setError("");
        setPartnerInquiriesWarning(err.message || "Partner inquiries are unavailable in this Supabase project right now.");
        return;
      }
      setError(err.message || "Could not load partner inquiries.");
    } finally {
      setPartnerInquiriesLoaded(true);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadForSuperuser() {
      if (!configured || !user?.id || !isSuperuser) {
        setOverview(null);
        setFeedbackRows([]);
        setFeedbackWarning("");
        setFeedbackLoaded(false);
        setPartnerInquiryRows([]);
        setPartnerInquiriesWarning("");
        setPartnerInquiriesLoaded(false);
        return;
      }
      setFeedbackLoaded(false);
      await Promise.all([loadOverview(), loadContentCatalog(), loadPageContentEditor()]);
      if (cancelled) return;
    }
    loadForSuperuser();
    return () => {
      cancelled = true;
    };
  }, [configured, isSuperuser, user?.id]);

  useEffect(() => {
    if (activeTab !== "feedback" || !configured || !user?.id || !isSuperuser || feedbackLoaded) return;
    loadFeedbackRows();
  }, [activeTab, configured, feedbackLoaded, isSuperuser, user?.id]);

  useEffect(() => {
    if (activeTab !== "partners" || !configured || !user?.id || !isSuperuser || partnerInquiriesLoaded) return;
    loadPartnerInquiryRows();
  }, [activeTab, configured, isSuperuser, partnerInquiriesLoaded, user?.id]);

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
        adminNote: `Superuser ${action} from Thuto control room.`,
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

  async function handleOpportunityImageUpload(event) {
    const file = selectedFile(event);
    event.target.value = "";
    if (!file) return;
    setBusyTarget("opportunity:image-upload");
    setError("");
    setNotice("");
    try {
      const url = await uploadOpportunityImage(file);
      setOpportunityForm((form) => ({ ...form, imageUrl: url }));
      setNotice("Flyer uploaded. Save the opportunity to publish the image URL.");
    } catch (err) {
      setError(err.message || "Could not upload opportunity image.");
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

  function editUniversityContent(id) {
    const university = contentUniversities.find((item) => item.id === id);
    if (!university) {
      setUniversityForm(EMPTY_UNIVERSITY_FORM);
      return;
    }
    setUniversityForm({
      id: university.id || "",
      name: university.name || "",
      location: university.location || "",
      description: university.description || "",
      website: university.website || "",
      phone: university.phone || "",
      applicationOpen: university.applicationOpen || "",
      applicationClose: university.applicationClose || "",
      applyUrl: university.applyUrl || "",
      campusPhoto: university.campusPhoto || university.campusImage || "",
      resourcesJson: toJson(university.resources),
      studentIncentivesJson: toJson(university.studentIncentives),
      published: true,
    });
  }

  function editProgrammeContent(id) {
    const programme = contentProgrammes.find((item) => item.id === id);
    if (!programme) {
      setProgrammeForm(EMPTY_PROGRAMME_FORM);
      return;
    }
    setProgrammeForm({
      id: programme.id || "",
      name: programme.name || "",
      university: programme.university || "",
      universityShort: programme.universityShort || "",
      field: programme.field || "",
      faculty: programme.faculty || "",
      minPoints: Number.isFinite(programme.minPoints) ? String(programme.minPoints) : "",
      duration: programme.duration || "",
      description: programme.description || "",
      officialUrl: programme.officialUrl || "",
      applyUrl: programme.applyUrl || "",
      applicationDeadline: programme.applicationDeadline || "",
      coverImage: programme.coverImage || programme.heroImage || "",
      careers: (programme.careers || programme.careerOpportunities || []).join(", "),
      tags: (programme.tags || []).join(", "),
      modulesJson: toJson(programme.modules),
      published: true,
    });
  }

  async function handleContentUpload(event, target) {
    const file = selectedFile(event);
    event.target.value = "";
    if (!file) return;
    setBusyTarget(`content-upload:${target}`);
    setError("");
    setNotice("");
    try {
      const url = await uploadContentAsset(file, target);
      if (target === "university-campus") {
        setUniversityForm((form) => ({ ...form, campusPhoto: url }));
      } else if (target === "programme-cover") {
        setProgrammeForm((form) => ({ ...form, coverImage: url }));
      }
      setNotice("Asset uploaded. Save the content form to publish the URL.");
    } catch (err) {
      setError(err.message || "Could not upload file.");
    } finally {
      setBusyTarget("");
    }
  }

  async function handleUniversitySave(event) {
    event.preventDefault();
    setBusyTarget("content:university:save");
    setError("");
    setNotice("");
    try {
      const resources = parseJsonArray(universityForm.resourcesJson, "Resources");
      for (const [index, resource] of resources.entries()) {
        if (!isAllowedExternalResourceUrl(resource?.url)) {
          throw new Error(
            `Resources[${index}] must link to an official institution URL (Thuto/Supabase hosting is not allowed).`,
          );
        }
      }
      const studentIncentives = parseJsonArray(universityForm.studentIncentivesJson, "Student incentives");
      for (const [index, incentive] of studentIncentives.entries()) {
        if (!String(incentive?.label || "").trim()) {
          throw new Error(`Student incentives[${index}] must include a label.`);
        }
        if (incentive?.sourceUrl && !isAllowedExternalResourceUrl(incentive.sourceUrl)) {
          throw new Error(
            `Student incentives[${index}] must link to an official institution URL (Thuto/Supabase hosting is not allowed).`,
          );
        }
      }
      const patch = {
        id: universityForm.id.trim(),
        name: universityForm.name.trim(),
        location: universityForm.location.trim(),
        description: universityForm.description.trim(),
        website: universityForm.website.trim(),
        phone: universityForm.phone.trim(),
        applicationOpen: universityForm.applicationOpen || null,
        applicationClose: universityForm.applicationClose || null,
        applyUrl: universityForm.applyUrl.trim(),
        campusPhoto: universityForm.campusPhoto.trim(),
        resources,
        studentIncentives,
      };
      await saveUniversityOverride({ id: patch.id, patch, published: universityForm.published });
      setNotice("University page saved.");
      await loadContentCatalog();
    } catch (err) {
      setError(err.message || "Could not save university page.");
    } finally {
      setBusyTarget("");
    }
  }

  async function handleProgrammeSave(event) {
    event.preventDefault();
    setBusyTarget("content:programme:save");
    setError("");
    setNotice("");
    try {
      const modules = parseJsonArray(programmeForm.modulesJson, "Modules");
      const minPoints = programmeForm.minPoints === "" ? null : Number(programmeForm.minPoints);
      if (programmeForm.minPoints !== "" && !Number.isFinite(minPoints)) throw new Error("Minimum points must be a number.");
      const patch = {
        id: programmeForm.id.trim(),
        name: programmeForm.name.trim(),
        university: programmeForm.university.trim(),
        universityShort: programmeForm.universityShort.trim(),
        field: programmeForm.field.trim(),
        faculty: programmeForm.faculty.trim(),
        minPoints,
        duration: programmeForm.duration.trim(),
        description: programmeForm.description.trim(),
        officialUrl: programmeForm.officialUrl.trim(),
        applyUrl: programmeForm.applyUrl.trim(),
        applicationDeadline: programmeForm.applicationDeadline || null,
        coverImage: programmeForm.coverImage.trim(),
        careers: csvList(programmeForm.careers),
        tags: csvList(programmeForm.tags),
        modules,
      };
      await saveProgrammeOverride({ id: patch.id, patch, published: programmeForm.published });
      setNotice("Programme page saved.");
      await loadContentCatalog();
    } catch (err) {
      setError(err.message || "Could not save programme page.");
    } finally {
      setBusyTarget("");
    }
  }

  async function handleDeleteUniversityOverride() {
    if (!universityForm.id) return;
    setBusyTarget("content:university:delete");
    setError("");
    setNotice("");
    try {
      await deleteUniversityOverride(universityForm.id);
      setNotice("University override deleted. Bundled data will show again.");
      setUniversityForm(EMPTY_UNIVERSITY_FORM);
      await loadContentCatalog();
    } catch (err) {
      setError(err.message || "Could not delete university override.");
    } finally {
      setBusyTarget("");
    }
  }

  async function handleDeleteProgrammeOverride() {
    if (!programmeForm.id) return;
    setBusyTarget("content:programme:delete");
    setError("");
    setNotice("");
    try {
      await deleteProgrammeOverride(programmeForm.id);
      setNotice("Programme override deleted. Bundled data will show again.");
      setProgrammeForm(EMPTY_PROGRAMME_FORM);
      await loadContentCatalog();
    } catch (err) {
      setError(err.message || "Could not delete programme override.");
    } finally {
      setBusyTarget("");
    }
  }

  async function handlePageContentPageChange(nextPageKey) {
    setBusyTarget("page-content:load");
    setError("");
    try {
      const rows = await fetchPageContent(nextPageKey, { includeDrafts: true });
      setPageContentRows(rows);
      const firstSection = Object.keys(PAGE_CONTENT_DEFAULTS[nextPageKey] || {})[0];
      hydratePageContentForm(nextPageKey, firstSection, rows);
    } catch (err) {
      setError(err.message || "Could not load page content.");
    } finally {
      setBusyTarget("");
    }
  }

  function handlePageContentSectionChange(nextSectionKey) {
    hydratePageContentForm(pageContentPageKey, nextSectionKey, pageContentRows);
  }

  async function handlePageContentSave(event) {
    event.preventDefault();
    setBusyTarget("page-content:save");
    setError("");
    setNotice("");
    try {
      await savePageSection({
        pageKey: pageContentPageKey,
        sectionKey: pageContentSectionKey,
        content: pageContentForm,
        published: pageContentPublished,
        sortOrder: pageContentSortOrder,
      });
      setNotice("Page section saved.");
      await loadPageContentEditor(pageContentPageKey);
    } catch (err) {
      setError(err.message || "Could not save page section.");
    } finally {
      setBusyTarget("");
    }
  }

  async function handlePageContentDelete() {
    if (!pageContentPageKey || !pageContentSectionKey) return;
    setBusyTarget("page-content:delete");
    setError("");
    setNotice("");
    try {
      await deletePageSection(pageContentPageKey, pageContentSectionKey);
      setNotice("Page section override deleted. Bundled defaults will show again.");
      await loadPageContentEditor(pageContentPageKey);
    } catch (err) {
      setError(err.message || "Could not delete page section override.");
    } finally {
      setBusyTarget("");
    }
  }

  async function handleFeedbackStatus(id, status) {
    setBusyTarget(`feedback:${id}`);
    setError("");
    setNotice("");
    try {
      await updateSupportFeedbackStatus(id, status);
      setNotice("Feedback status updated.");
      await loadFeedbackRows();
    } catch (err) {
      if (isSupportFeedbackUnavailableError(err)) {
        setError("");
        setFeedbackWarning(err.message || "Support feedback is unavailable in this Supabase project right now.");
        return;
      }
      setError(err.message || "Could not update feedback.");
    } finally {
      setBusyTarget("");
    }
  }

  async function handlePartnerInquiryStatus(id, status) {
    setBusyTarget(`partner-inquiry:${id}`);
    setError("");
    setNotice("");
    try {
      await updatePartnerInquiryStatus(id, status);
      setNotice("Partner inquiry status updated.");
      await loadPartnerInquiryRows();
    } catch (err) {
      if (isPartnerInquiriesUnavailableError(err)) {
        setError("");
        setPartnerInquiriesWarning(err.message || "Partner inquiries are unavailable in this Supabase project right now.");
        return;
      }
      setError(err.message || "Could not update partner inquiry.");
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
        <h1 className="font-display text-3xl font-bold text-brand-900">Superuser</h1>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Supabase must be configured before live admin controls can work.
        </p>
      </div>
    );
  }

  if (!user && !isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-brand-900">Superuser</h1>
        <p className="rounded-2xl border border-brand-100 bg-white p-4 text-sm text-stone-600 shadow-sm">
          <Link to="/auth?mode=login" className="font-semibold text-brand-700 underline">
            Log in
          </Link>{" "}
          with a Thuto superuser account to control operations.
        </p>
      </div>
    );
  }

  if (isLoading || (user && isSuperuserLoading)) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-brand-900">Superuser</h1>
        <p className="rounded-2xl border border-brand-100 bg-white p-4 text-sm text-stone-500 shadow-sm">
          Checking superuser access...
        </p>
      </div>
    );
  }

  if (!isSuperuser) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-brand-900">Superuser</h1>
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          This account is not listed as a Thuto superuser.
        </p>
      </div>
    );
  }

  const localData = overview?.localData;
  const counts = overview?.counts || {};
  const opportunityImagePreview = safeExternalUrl(opportunityForm.imageUrl);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Thuto superuser</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-brand-950">Control room</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
            Run moderation, inspect live operations, and jump into the main surfaces from one superuser page.
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

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-brand-100 bg-white p-2 shadow-sm" aria-label="Admin sections">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              "focus-ring whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition",
              activeTab === tab.key ? "bg-brand-700 text-white shadow-sm" : "text-stone-600 hover:bg-brand-50 hover:text-brand-900",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className={`${activeTab === "overview" ? "grid" : "hidden"} gap-3 sm:grid-cols-2 lg:grid-cols-3`}>
        <Stat label="Needs review" value={counts.pendingFeed || 0} detail={`${counts.reports || 0} recent reports`} />
        <Stat label="Readable profiles" value={counts.profiles ?? 0} detail={`${counts.premiumProfiles ?? 0} premium profiles`} />
        <Stat label="Opportunities" value={counts.opportunities ?? 0} detail="Sponsorship and postgraduate scholarship rows" />
        <Stat label="Programmes" value={localData?.programmesTotal ?? 0} detail={`${localData?.programmesMissingMinPoints ?? 0} missing points`} />
        <Stat label="Institutions" value={localData?.universitiesTotal ?? 0} detail={`${localData?.universitiesWithResources ?? 0} with resources`} />
        <Stat label="Application dates" value={localData?.universitiesWithOpenDates ?? 0} detail="Universities with window data" />
      </section>

      <section className={`${activeTab === "overview" ? "grid" : "hidden"} gap-3 sm:grid-cols-2`}>
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

      <section className={`${activeTab === "catalog" ? "block" : "hidden"} rounded-3xl border border-brand-100 bg-white p-4 shadow-sm`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-950">University page editor</h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              Edit institution text, dates, campus photos, and external resource links.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUniversityForm(EMPTY_UNIVERSITY_FORM)}
            className="focus-ring rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
          >
            New university
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[16rem_1fr]">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Load existing
            <select
              value={universityForm.id}
              onChange={(event) => editUniversityContent(event.target.value)}
              className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
            >
              <option value="">Choose university...</option>
              {contentUniversities.map((university) => (
                <option key={university.id} value={university.id}>
                  {university.name || university.id}
                </option>
              ))}
            </select>
          </label>
          <form onSubmit={handleUniversitySave} className="grid gap-3 rounded-2xl bg-stone-50 p-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                ID
                <input
                  required
                  value={universityForm.id}
                  onChange={(event) => setUniversityForm((form) => ({ ...form, id: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 sm:col-span-2">
                Name
                <input
                  required
                  value={universityForm.name}
                  onChange={(event) => setUniversityForm((form) => ({ ...form, name: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Location
                <input
                  value={universityForm.location}
                  onChange={(event) => setUniversityForm((form) => ({ ...form, location: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Phone
                <input
                  value={universityForm.phone}
                  onChange={(event) => setUniversityForm((form) => ({ ...form, phone: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
            </div>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Description
              <textarea
                rows={3}
                value={universityForm.description}
                onChange={(event) => setUniversityForm((form) => ({ ...form, description: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Website
                <input
                  type="url"
                  value={universityForm.website}
                  onChange={(event) => setUniversityForm((form) => ({ ...form, website: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Apply URL
                <input
                  type="url"
                  value={universityForm.applyUrl}
                  onChange={(event) => setUniversityForm((form) => ({ ...form, applyUrl: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Opens
                <input
                  type="date"
                  value={universityForm.applicationOpen || ""}
                  onChange={(event) => setUniversityForm((form) => ({ ...form, applicationOpen: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Closes
                <input
                  type="date"
                  value={universityForm.applicationClose || ""}
                  onChange={(event) => setUniversityForm((form) => ({ ...form, applicationClose: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Campus photo URL
                <input
                  value={universityForm.campusPhoto}
                  onChange={(event) => setUniversityForm((form) => ({ ...form, campusPhoto: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="focus-ring self-end rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50">
                Upload photo
                <input type="file" accept="image/*" onChange={(event) => handleContentUpload(event, "university-campus")} className="sr-only" />
              </label>
            </div>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Resources JSON
              <textarea
                rows={5}
                value={universityForm.resourcesJson}
                onChange={(event) => setUniversityForm((form) => ({ ...form, resourcesJson: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 font-mono text-xs normal-case tracking-normal text-stone-800"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Student incentives JSON
              <textarea
                rows={5}
                value={universityForm.studentIncentivesJson}
                onChange={(event) => setUniversityForm((form) => ({ ...form, studentIncentivesJson: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 font-mono text-xs normal-case tracking-normal text-stone-800"
              />
            </label>
            <p className="text-xs leading-relaxed text-stone-500">
              Resource and incentive URLs must point to official institution websites. Categories: accommodation, laptop,
              discount, bursary, other.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-semibold text-brand-900">
                <input
                  type="checkbox"
                  checked={universityForm.published}
                  onChange={(event) => setUniversityForm((form) => ({ ...form, published: event.target.checked }))}
                />
                Published
              </label>
              <button
                type="submit"
                disabled={busyTarget === "content:university:save"}
                className="focus-ring rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
              >
                Save university
              </button>
              <button
                type="button"
                disabled={!universityForm.id || busyTarget === "content:university:delete"}
                onClick={handleDeleteUniversityOverride}
                className="focus-ring rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                Delete override
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className={`${activeTab === "catalog" ? "block" : "hidden"} rounded-3xl border border-brand-100 bg-white p-4 shadow-sm`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-950">Programme page editor</h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              Add or edit programmes, application links, covers, careers, tags, and module samples.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setProgrammeForm(EMPTY_PROGRAMME_FORM)}
            className="focus-ring rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
          >
            New programme
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[16rem_1fr]">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Load existing
            <select
              value={programmeForm.id}
              onChange={(event) => editProgrammeContent(event.target.value)}
              className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
            >
              <option value="">Choose programme...</option>
              {contentProgrammes.slice(0, 600).map((programme) => (
                <option key={programme.id} value={programme.id}>
                  {programme.name || programme.id}
                </option>
              ))}
            </select>
          </label>
          <form onSubmit={handleProgrammeSave} className="grid gap-3 rounded-2xl bg-stone-50 p-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                ID
                <input
                  required
                  value={programmeForm.id}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, id: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 sm:col-span-2">
                Name
                <input
                  required
                  value={programmeForm.name}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, name: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                University
                <input
                  required
                  value={programmeForm.university}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, university: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                University short
                <input
                  value={programmeForm.universityShort}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, universityShort: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Field
                <input
                  value={programmeForm.field}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, field: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Faculty
                <input
                  value={programmeForm.faculty}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, faculty: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Min points
                <input
                  type="number"
                  value={programmeForm.minPoints}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, minPoints: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Duration
                <input
                  value={programmeForm.duration}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, duration: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Application deadline
                <input
                  type="date"
                  value={programmeForm.applicationDeadline || ""}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, applicationDeadline: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
            </div>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Description
              <textarea
                rows={3}
                value={programmeForm.description}
                onChange={(event) => setProgrammeForm((form) => ({ ...form, description: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Official URL
                <input
                  type="url"
                  value={programmeForm.officialUrl}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, officialUrl: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Apply URL
                <input
                  type="url"
                  value={programmeForm.applyUrl}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, applyUrl: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Cover image URL
                <input
                  value={programmeForm.coverImage}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, coverImage: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="focus-ring self-end rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50">
                Upload cover
                <input type="file" accept="image/*" onChange={(event) => handleContentUpload(event, "programme-cover")} className="sr-only" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Careers (comma-separated)
                <input
                  value={programmeForm.careers}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, careers: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Tags (comma-separated)
                <input
                  value={programmeForm.tags}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, tags: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
            </div>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Modules JSON
              <textarea
                rows={5}
                value={programmeForm.modulesJson}
                onChange={(event) => setProgrammeForm((form) => ({ ...form, modulesJson: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 font-mono text-xs normal-case tracking-normal text-stone-800"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-semibold text-brand-900">
                <input
                  type="checkbox"
                  checked={programmeForm.published}
                  onChange={(event) => setProgrammeForm((form) => ({ ...form, published: event.target.checked }))}
                />
                Published
              </label>
              <button
                type="submit"
                disabled={busyTarget === "content:programme:save"}
                className="focus-ring rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
              >
                Save programme
              </button>
              <button
                type="button"
                disabled={!programmeForm.id || busyTarget === "content:programme:delete"}
                onClick={handleDeleteProgrammeOverride}
                className="focus-ring rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                Delete override
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className={`${activeTab === "pages" ? "block" : "hidden"} rounded-3xl border border-brand-100 bg-white p-4 shadow-sm`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-950">Page content editor</h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              Edit public page sections with structured fields. Unpublished drafts are visible only to superusers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadPageContentEditor(pageContentPageKey)}
            className="focus-ring rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
          >
            Reload page content
          </button>
        </div>
        <form onSubmit={handlePageContentSave} className="mt-3 grid gap-4 rounded-2xl bg-stone-50 p-3">
          <div className="grid gap-3 sm:grid-cols-[12rem_1fr_8rem]">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Page
              <select
                value={pageContentPageKey}
                onChange={(event) => handlePageContentPageChange(event.target.value)}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              >
                {PAGE_CONTENT_META.map((page) => (
                  <option key={page.pageKey} value={page.pageKey}>
                    {page.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Section
              <select
                value={pageContentSectionKey}
                onChange={(event) => handlePageContentSectionChange(event.target.value)}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              >
                {Object.keys(PAGE_CONTENT_DEFAULTS[pageContentPageKey] || {}).map((sectionKey) => {
                  const row = pageContentRows.find((item) => item.section_key === sectionKey);
                  return (
                    <option key={sectionKey} value={sectionKey}>
                      {labelize(sectionKey)}{row ? (row.published ? " (live)" : " (draft)") : ""}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Sort
              <input
                type="number"
                value={pageContentSortOrder}
                onChange={(event) => setPageContentSortOrder(Number(event.target.value || 0))}
                className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              />
            </label>
          </div>
          <StructuredContentFields value={pageContentForm} onChange={setPageContentForm} />
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-semibold text-brand-900">
              <input
                type="checkbox"
                checked={pageContentPublished}
                onChange={(event) => setPageContentPublished(event.target.checked)}
              />
              Published
            </label>
            <button
              type="submit"
              disabled={busyTarget === "page-content:save"}
              className="focus-ring rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              Save section
            </button>
            <button
              type="button"
              disabled={busyTarget === "page-content:delete"}
              onClick={handlePageContentDelete}
              className="focus-ring rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Delete override
            </button>
          </div>
        </form>
      </section>

      <section className={`${activeTab === "overview" ? "block" : "hidden"} rounded-3xl border border-brand-100 bg-white p-4 shadow-sm`}>
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

      <section className={`${activeTab === "overview" ? "block" : "hidden"} rounded-3xl border border-brand-100 bg-white p-4 shadow-sm`}>
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

      <section className={`${activeTab === "opportunities" ? "block" : "hidden"} rounded-3xl border border-brand-100 bg-white p-4 shadow-sm`}>
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
                <option value="postgraduate_scholarship">Postgraduate scholarship</option>
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
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Image URL
                <input
                  type="url"
                  value={opportunityForm.imageUrl}
                  onChange={(event) => setOpportunityForm((form) => ({ ...form, imageUrl: event.target.value }))}
                  className="focus-ring mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
                />
              </label>
              <label className="focus-ring inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50">
                {busyTarget === "opportunity:image-upload" ? "Uploading..." : "Upload flyer/image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleOpportunityImageUpload}
                  disabled={busyTarget === "opportunity:image-upload"}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
          {opportunityImagePreview ? (
            <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white">
              <img
                src={opportunityImagePreview}
                alt=""
                className="max-h-56 w-full object-contain object-center"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : null}
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

      <section className={`${activeTab === "feedback" ? "block" : "hidden"} rounded-3xl border border-brand-100 bg-white p-4 shadow-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-brand-950">Support feedback</h2>
          <button
            type="button"
            onClick={loadFeedbackRows}
            className="focus-ring rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
          >
            Refresh feedback
          </button>
        </div>
        {feedbackWarning ? (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p>{feedbackWarning}</p>
            <p className="mt-2 text-amber-800/90">
              Once the table migration is applied in Supabase, refresh this tab and feedback submissions will appear here.
            </p>
          </div>
        ) : feedbackRows.length ? (
          <div className="mt-3 grid gap-3">
            {feedbackRows.map((row) => (
              <article key={row.id} className="rounded-2xl bg-stone-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-950">{labelize(row.topic)}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {formatDate(row.created_at)} / {row.contact_email || row.user_id || "No contact"}
                    </p>
                  </div>
                  <select
                    value={row.status}
                    disabled={busyTarget === `feedback:${row.id}`}
                    onChange={(event) => handleFeedbackStatus(row.id, event.target.value)}
                    className="focus-ring rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium text-stone-800 disabled:opacity-60"
                  >
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{row.message}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No support feedback rows yet.</p>
        )}
      </section>

      <section className={`${activeTab === "partners" ? "block" : "hidden"} rounded-3xl border border-brand-100 bg-white p-4 shadow-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-brand-950">Partner inquiries</h2>
          <button
            type="button"
            onClick={loadPartnerInquiryRows}
            className="focus-ring rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
          >
            Refresh inquiries
          </button>
        </div>
        {partnerInquiriesWarning ? (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p>{partnerInquiriesWarning}</p>
            <p className="mt-2 text-amber-800/90">
              Once the partner inquiries migration is applied in Supabase, refresh this tab and submissions from /partners will appear here.
            </p>
          </div>
        ) : partnerInquiryRows.length ? (
          <div className="mt-3 grid gap-3">
            {partnerInquiryRows.map((row) => (
              <article key={row.id} className="rounded-2xl bg-stone-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-950">
                      {row.organization} · {labelize(row.partner_type)}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {row.name} / {row.email} / {formatDate(row.created_at)}
                    </p>
                  </div>
                  <select
                    value={row.status}
                    disabled={busyTarget === `partner-inquiry:${row.id}`}
                    onChange={(event) => handlePartnerInquiryStatus(row.id, event.target.value)}
                    className="focus-ring rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-medium text-stone-800 disabled:opacity-60"
                  >
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="contacted">Contacted</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                {row.message ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{row.message}</p>
                ) : (
                  <p className="mt-3 text-sm text-stone-500">No message provided.</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No partner inquiry rows yet.</p>
        )}
      </section>

      <section className={`${activeTab === "premium" ? "block" : "hidden"} rounded-3xl border border-brand-100 bg-white p-4 shadow-sm`}>
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
                        <option value="">None</option>
                        <option value="yearly">Yearly (P59)</option>
                        <option value="five_year">5-Year (P199)</option>
                        <option value="season_pass">Season (legacy)</option>
                        <option value="monthly">Monthly (legacy)</option>
                        <option value="annual">Annual (legacy)</option>
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
