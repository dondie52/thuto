/**
 * Application tracking.
 *
 * Two things students need and Thuto never recorded: where they have already applied, and a way
 * to apply at all to the institutions that have no online portal.
 *
 * Signed out, or with Supabase unconfigured, external and manual records live in localStorage
 * exactly like bookmarks do, so tracking works for everyone. Hosted applications need a real
 * account — a form that can neither reach the institution nor store documents is worse than no
 * button, so it is hidden rather than shown broken.
 */

import { getSupabase, isSupabaseConfigured } from "./supabase.js";
import { randomId, safeFileName } from "./fileNames.js";
import { daysFromTodayTo, formatCountdown, isDeadlineWithinDays } from "./applicationDates.js";
import { getApplicationDocuments } from "./applicationDocuments.js";

const STORAGE_KEY = "thuto.applications";
const DOCUMENT_BUCKET = "application-documents";

/** Bump when the consent wording changes, so what a student agreed to stays auditable. */
export const CONSENT_VERSION = "v1";

const ROW_COLUMNS =
  "id, user_id, institution_id, institution_name, programme_id, programme_name, channel, status," +
  " form_data, documents, consent_version, consent_at, external_url, external_click_count," +
  " external_last_clicked_at, external_confirmed, shared_with_institution, reference_code, deadline," +
  " source, submitted_at, decided_at, status_changed_at, institution_message, student_note," +
  " created_at, updated_at";

/**
 * @typedef {'draft'|'pending'|'awaiting_interview'|'accepted'|'rejected'|'withdrawn'} ApplicationStatus
 * @typedef {'hosted'|'external'|'manual'} ApplicationChannel
 * @typedef {{
 *   key: string, label: string, storagePath: string, fileName: string,
 *   mimeType: string, fileSize: number, uploadedAt: string,
 * }} ApplicationDocument
 * @typedef {{
 *   id: string, userId: string|null, institutionId: string, institutionName: string,
 *   programmeId: string|null, programmeName: string,
 *   channel: ApplicationChannel, status: ApplicationStatus,
 *   formData: Record<string, unknown>, documents: ApplicationDocument[],
 *   externalUrl: string|null, externalClickCount: number, externalLastClickedAt: string|null,
 *   externalConfirmed: boolean, sharedWithInstitution: boolean,
 *   referenceCode: string|null, deadline: string|null, source: string,
 *   submittedAt: string|null, decidedAt: string|null,
 *   institutionMessage: string, studentNote: string,
 *   createdAt: string, updatedAt: string, isLocal: boolean,
 * }} StudentApplication
 * @typedef {{
 *   institutionId: string, acceptsHosted: boolean, applicationsOpen: boolean,
 *   externalApplyUrl: string|null, feeAmount: number|null, feeCurrency: string, feeNote: string,
 *   requiredFields: string[],
 *   requiredDocuments: { key: string, label: string, required: boolean }[],
 *   maxProgrammeChoices: number, instructions: string,
 * }} ApplicationSettings
 */

// ---------------------------------------------------------------------------
// Status vocabulary
// ---------------------------------------------------------------------------

/** @type {Record<ApplicationStatus, { label: string, tone: string, blurb: string }>} */
export const APPLICATION_STATUS_META = {
  draft: { label: "Draft", tone: "slate", blurb: "Not submitted yet." },
  pending: { label: "Pending", tone: "amber", blurb: "Submitted and waiting on a decision." },
  awaiting_interview: { label: "Awaiting interview", tone: "brand", blurb: "You have been invited to interview." },
  accepted: { label: "Accepted", tone: "emerald", blurb: "You have an offer." },
  rejected: { label: "Rejected", tone: "rose", blurb: "This one did not come through." },
  withdrawn: { label: "Withdrawn", tone: "slate", blurb: "You withdrew this application." },
};

/** Institution-facing tabs, in the order the CMS shows them. */
export const CMS_STATUS_TABS = /** @type {ApplicationStatus[]} */ ([
  "pending",
  "accepted",
  "rejected",
  "awaiting_interview",
]);

/** Statuses a student may set themselves, on records the institution does not own. */
export const SELF_MANAGED_STATUSES = /** @type {ApplicationStatus[]} */ ([
  "pending",
  "awaiting_interview",
  "accepted",
  "rejected",
]);

/** @param {ApplicationStatus} status */
export function applicationStatusLabel(status) {
  return APPLICATION_STATUS_META[status]?.label || status;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** @param {ApplicationSettings | null | undefined} settings */
export function canApplyThroughThuto(settings) {
  return Boolean(settings?.acceptsHosted && settings.applicationsOpen);
}

/**
 * Deadline urgency, reusing the same helpers the institution pages already use so countdown
 * copy is worded identically everywhere.
 * @param {StudentApplication} application
 */
export function applicationDeadlineState(application) {
  const deadline = application?.deadline;
  if (!deadline) return { daysLeft: null, countdown: null, urgent: false };
  return {
    daysLeft: daysFromTodayTo(deadline),
    countdown: formatCountdown(deadline),
    urgent: isDeadlineWithinDays(deadline, 30),
  };
}

/**
 * Three buckets rather than tabs: the list is short, and scanning beats clicking on a phone.
 * @param {StudentApplication[]} list
 */
export function groupApplicationsByBucket(list) {
  const actionNeeded = [];
  const inProgress = [];
  const decided = [];
  const withdrawn = [];

  for (const application of list || []) {
    if (application.status === "withdrawn") {
      withdrawn.push(application);
      continue;
    }
    if (application.status === "accepted" || application.status === "rejected") {
      decided.push(application);
      continue;
    }
    const { urgent } = applicationDeadlineState(application);
    const unconfirmed = application.channel !== "hosted" && !application.externalConfirmed;
    if (application.status === "draft" || urgent || unconfirmed) {
      actionNeeded.push(application);
      continue;
    }
    inProgress.push(application);
  }

  const byDeadline = (a, b) => {
    const da = a.deadline || "9999-12-31";
    const db = b.deadline || "9999-12-31";
    if (da !== db) return da < db ? -1 : 1;
    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  };

  return {
    actionNeeded: actionNeeded.sort(byDeadline),
    inProgress: inProgress.sort(byDeadline),
    decided: decided.sort((a, b) => (b.decidedAt || b.updatedAt || "").localeCompare(a.decidedAt || a.updatedAt || "")),
    withdrawn,
  };
}

/** @param {StudentApplication[]} list */
export function countApplicationsByStatus(list) {
  const counts = Object.fromEntries(Object.keys(APPLICATION_STATUS_META).map((key) => [key, 0]));
  for (const application of list || []) {
    counts[application.status] = (counts[application.status] || 0) + 1;
  }
  return counts;
}

/**
 * What an institution asks for, falling back to Thuto's generic checklist so students still get
 * useful guidance from an institution that has configured nothing.
 *
 * @param {ApplicationSettings | null} settings
 * @param {Record<string, unknown> | null} programme
 */
export function requiredDocumentsForApplication(settings, programme) {
  const configured = settings?.requiredDocuments?.length ? settings.requiredDocuments : null;
  if (configured) return configured;
  return getApplicationDocuments(programme || {}).map((doc) => ({
    key: doc.id,
    label: doc.label,
    required: true,
  }));
}

/**
 * What is still outstanding on a draft, driving both the "3 items left" pill and whether the
 * submit button is enabled.
 *
 * @param {StudentApplication} application
 * @param {ApplicationSettings | null} settings
 * @param {Record<string, unknown> | null} [programme]
 */
export function missingRequirements(application, settings, programme = null) {
  const fields = [];
  const documents = [];
  const formData = application?.formData || {};

  for (const key of settings?.requiredFields || []) {
    const value = formData[key];
    if (value == null || String(value).trim() === "") fields.push(key);
  }

  const uploaded = new Set((application?.documents || []).map((doc) => doc.key));
  for (const doc of requiredDocumentsForApplication(settings, programme)) {
    if (doc.required !== false && !uploaded.has(doc.key)) documents.push(doc.label || doc.key);
  }

  return { fields, documents, total: fields.length + documents.length };
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

function toCamel(row, { isLocal = false } = {}) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id ?? null,
    institutionId: row.institution_id || "",
    institutionName: row.institution_name || "",
    programmeId: row.programme_id ?? null,
    programmeName: row.programme_name || "",
    channel: row.channel || "external",
    status: row.status || "pending",
    formData: row.form_data && typeof row.form_data === "object" ? row.form_data : {},
    documents: Array.isArray(row.documents) ? row.documents.map(toCamelDocument) : [],
    consentVersion: row.consent_version || CONSENT_VERSION,
    consentAt: row.consent_at ?? null,
    externalUrl: row.external_url ?? null,
    externalClickCount: Number(row.external_click_count || 0),
    externalLastClickedAt: row.external_last_clicked_at ?? null,
    externalConfirmed: Boolean(row.external_confirmed),
    sharedWithInstitution: Boolean(row.shared_with_institution),
    referenceCode: row.reference_code ?? null,
    deadline: row.deadline ?? null,
    source: row.source || "unknown",
    submittedAt: row.submitted_at ?? null,
    decidedAt: row.decided_at ?? null,
    statusChangedAt: row.status_changed_at ?? null,
    institutionMessage: row.institution_message || "",
    studentNote: row.student_note || "",
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
    isLocal,
  };
}

function toCamelDocument(doc) {
  return {
    key: doc?.key || "",
    label: doc?.label || "",
    storagePath: doc?.storage_path || doc?.storagePath || "",
    fileName: doc?.file_name || doc?.fileName || "",
    mimeType: doc?.mime_type || doc?.mimeType || "",
    fileSize: Number(doc?.file_size || doc?.fileSize || 0),
    uploadedAt: doc?.uploaded_at || doc?.uploadedAt || "",
  };
}

function toSnakeDocument(doc) {
  return {
    key: doc.key,
    label: doc.label,
    storage_path: doc.storagePath,
    file_name: doc.fileName,
    mime_type: doc.mimeType,
    file_size: doc.fileSize,
    uploaded_at: doc.uploadedAt,
  };
}

function settingsToCamel(row) {
  if (!row) return null;
  return {
    institutionId: row.institution_id,
    acceptsHosted: Boolean(row.accepts_hosted_applications),
    applicationsOpen: Boolean(row.applications_open),
    externalApplyUrl: row.external_apply_url ?? null,
    feeAmount: row.application_fee_amount == null ? null : Number(row.application_fee_amount),
    feeCurrency: row.application_fee_currency || "BWP",
    feeNote: row.application_fee_note || "",
    requiredFields: Array.isArray(row.required_fields) ? row.required_fields : [],
    requiredDocuments: Array.isArray(row.required_documents) ? row.required_documents : [],
    maxProgrammeChoices: Number(row.max_programme_choices || 3),
    instructions: row.instructions || "",
    notifyEmail: row.notify_email ?? null,
  };
}

// ---------------------------------------------------------------------------
// Local store — same shape as bookmarks.js
// ---------------------------------------------------------------------------

export { STORAGE_KEY };

/** @returns {StudentApplication[]} */
export function getLocalApplications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row) => row && typeof row === "object" && row.id);
  } catch {
    return [];
  }
}

function writeLocal(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota or private mode */
  }
  return list;
}

/** @param {StudentApplication} record */
export function upsertLocalApplication(record) {
  const current = getLocalApplications();
  const index = current.findIndex((row) => row.id === record.id);
  const next = index >= 0 ? current.map((row, i) => (i === index ? { ...row, ...record } : row)) : [record, ...current];
  return writeLocal(next);
}

/** @param {string} id */
export function removeLocalApplication(id) {
  return writeLocal(getLocalApplications().filter((row) => row.id !== id));
}

export function clearLocalApplications() {
  return writeLocal([]);
}

function localKeyFor(institutionId, programmeId) {
  return `${institutionId}::${programmeId || ""}`;
}

function newLocalApplication(input) {
  const now = new Date().toISOString();
  return {
    id: `local-${randomId()}`,
    userId: null,
    institutionId: input.institutionId,
    institutionName: input.institutionName || "",
    programmeId: input.programmeId || null,
    programmeName: input.programmeName || "",
    channel: input.channel || "external",
    status: "pending",
    formData: {},
    documents: [],
    consentVersion: CONSENT_VERSION,
    consentAt: null,
    externalUrl: input.externalUrl || null,
    externalClickCount: 1,
    externalLastClickedAt: now,
    externalConfirmed: false,
    sharedWithInstitution: false,
    referenceCode: null,
    deadline: input.deadline || null,
    source: input.source || "unknown",
    submittedAt: null,
    decidedAt: null,
    statusChangedAt: null,
    institutionMessage: "",
    studentNote: input.studentNote || "",
    createdAt: now,
    updatedAt: now,
    isLocal: true,
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

async function currentUserId() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

/** @returns {Promise<StudentApplication[]>} */
export async function fetchMyApplications() {
  const supabase = getSupabase();
  const userId = await currentUserId();
  if (!supabase || !userId) return getLocalApplications();

  const { data, error } = await supabase
    .from("student_applications")
    .select(ROW_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("Applications fetch failed:", error.message);
    return getLocalApplications();
  }
  return (data || []).map((row) => toCamel(row));
}

/**
 * @param {string} institutionId
 * @returns {Promise<ApplicationSettings | null>}
 */
export async function fetchApplicationSettings(institutionId) {
  const supabase = getSupabase();
  if (!supabase || !institutionId) return null;
  const { data, error } = await supabase
    .from("institution_application_settings")
    .select("*")
    .eq("institution_id", institutionId)
    .maybeSingle();
  if (error) {
    console.warn("Application settings fetch failed:", error.message);
    return null;
  }
  return settingsToCamel(data);
}

/**
 * @param {string[]} institutionIds
 * @returns {Promise<Record<string, ApplicationSettings>>}
 */
export async function fetchApplicationSettingsMap(institutionIds = []) {
  const supabase = getSupabase();
  const ids = [...new Set(institutionIds.filter(Boolean))];
  if (!supabase || !ids.length) return {};
  const { data, error } = await supabase
    .from("institution_application_settings")
    .select("*")
    .in("institution_id", ids);
  if (error) {
    console.warn("Application settings fetch failed:", error.message);
    return {};
  }
  return Object.fromEntries((data || []).map((row) => [row.institution_id, settingsToCamel(row)]));
}

/** @param {string} applicationId */
export async function fetchApplicationEvents(applicationId) {
  const supabase = getSupabase();
  if (!supabase || !applicationId) return [];
  const { data, error } = await supabase
    .from("student_application_events")
    .select("id, actor_role, event_type, from_status, to_status, message, visible_to_student, created_at")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

/**
 * The documents bucket is private, so links are signed on demand and never stored.
 * @param {string} storagePath
 * @param {number} [expiresIn] seconds
 */
export async function createDocumentSignedUrl(storagePath, expiresIn = 300) {
  const supabase = getSupabase();
  if (!supabase || !storagePath) return null;
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(storagePath, expiresIn);
  if (error) {
    console.warn("Could not sign document URL:", error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Records that a student opened an institution's own apply flow.
 *
 * Idempotent: clicking Apply again bumps the counter rather than creating a second row. The
 * record is deliberately not marked as submitted — a click is intent, and claiming otherwise
 * would put a false "you applied" in the student's own history.
 *
 * @param {{
 *   institutionId: string, institutionName?: string, programmeId?: string|null,
 *   programmeName?: string, externalUrl?: string|null, deadline?: string|null, source?: string,
 * }} input
 */
export async function recordApplyClick(input) {
  if (!input?.institutionId) return null;
  const supabase = getSupabase();
  const userId = await currentUserId();

  if (!supabase || !userId) {
    const current = getLocalApplications();
    const key = localKeyFor(input.institutionId, input.programmeId);
    const existing = current.find(
      (row) => localKeyFor(row.institutionId, row.programmeId) === key && row.status !== "withdrawn",
    );
    if (existing) {
      upsertLocalApplication({
        ...existing,
        externalClickCount: (existing.externalClickCount || 0) + 1,
        externalLastClickedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return existing;
    }
    const record = newLocalApplication({ ...input, channel: "external" });
    upsertLocalApplication(record);
    return record;
  }

  const { data: existing } = await supabase
    .from("student_applications")
    .select("id, external_click_count")
    .eq("user_id", userId)
    .eq("institution_id", input.institutionId)
    .eq("programme_id", input.programmeId || null)
    .not("status", "in", "(withdrawn,rejected)")
    .maybeSingle();

  const now = new Date().toISOString();
  if (existing?.id) {
    const { data, error } = await supabase
      .from("student_applications")
      .update({
        external_click_count: Number(existing.external_click_count || 0) + 1,
        external_last_clicked_at: now,
      })
      .eq("id", existing.id)
      .select(ROW_COLUMNS)
      .single();
    if (error) {
      console.warn("Could not record apply click:", error.message);
      return null;
    }
    return toCamel(data);
  }

  const { data, error } = await supabase
    .from("student_applications")
    .insert({
      user_id: userId,
      institution_id: input.institutionId,
      institution_name: (input.institutionName || "").slice(0, 200),
      programme_id: input.programmeId || null,
      programme_name: (input.programmeName || "").slice(0, 200),
      channel: "external",
      status: "pending",
      external_url: (input.externalUrl || "").slice(0, 2000) || null,
      external_first_clicked_at: now,
      external_last_clicked_at: now,
      external_click_count: 1,
      deadline: input.deadline || null,
      source: input.source || "unknown",
    })
    .select(ROW_COLUMNS)
    .single();

  if (error) {
    console.warn("Could not record application:", error.message);
    return null;
  }
  return toCamel(data);
}

/**
 * Manual entry, for students who applied before they found Thuto.
 * @param {{ institutionId: string, institutionName?: string, programmeName?: string, deadline?: string|null, status?: ApplicationStatus, studentNote?: string }} input
 */
export async function addManualApplication(input) {
  const supabase = getSupabase();
  const userId = await currentUserId();
  const status = SELF_MANAGED_STATUSES.includes(input.status) ? input.status : "pending";

  if (!supabase || !userId) {
    const record = { ...newLocalApplication({ ...input, channel: "manual" }), status, externalClickCount: 0 };
    upsertLocalApplication(record);
    return record;
  }

  const { data, error } = await supabase
    .from("student_applications")
    .insert({
      user_id: userId,
      institution_id: input.institutionId,
      institution_name: (input.institutionName || "").slice(0, 200),
      programme_name: (input.programmeName || "").slice(0, 200),
      channel: "manual",
      status,
      deadline: input.deadline || null,
      student_note: (input.studentNote || "").slice(0, 1000),
      source: "manual",
    })
    .select(ROW_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

/** @param {{ institutionId: string, institutionName?: string, programmeId?: string|null, programmeName?: string, deadline?: string|null, source?: string }} input */
export async function createHostedDraft(input) {
  const supabase = getSupabase();
  const userId = await currentUserId();
  if (!supabase || !userId) throw new Error("Sign in to apply through Thuto.");

  const settings = await fetchApplicationSettings(input.institutionId);
  if (!canApplyThroughThuto(settings)) {
    throw new Error("This institution is not accepting Thuto applications right now.");
  }

  const { data, error } = await supabase
    .from("student_applications")
    .insert({
      user_id: userId,
      institution_id: input.institutionId,
      institution_name: (input.institutionName || "").slice(0, 200),
      programme_id: input.programmeId || null,
      programme_name: (input.programmeName || "").slice(0, 200),
      channel: "hosted",
      status: "draft",
      deadline: input.deadline || null,
      source: input.source || "unknown",
    })
    .select(ROW_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

/** @param {string} id @param {{ formData?: Record<string, unknown>, studentNote?: string }} patch */
export async function saveHostedDraft(id, patch) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  const update = {};
  if (patch.formData) update.form_data = patch.formData;
  if (patch.studentNote != null) update.student_note = String(patch.studentNote).slice(0, 1000);
  const { data, error } = await supabase
    .from("student_applications")
    .update(update)
    .eq("id", id)
    .select(ROW_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

/** @param {{ applicationId: string, docKey: string, docLabel: string, file: File }} input */
export async function uploadApplicationDocument({ applicationId, docKey, docLabel, file }) {
  const supabase = getSupabase();
  const userId = await currentUserId();
  if (!supabase || !userId) throw new Error("Sign in to upload documents.");
  if (!file) throw new Error("Choose a file to upload.");
  // The bucket enforces both of these, but a friendly message beats a storage error.
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error("Files must be 10 MB or smaller.");
  if (file.type && !ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    throw new Error("Upload a PDF, JPEG, PNG, or WebP file.");
  }

  // User id first: the storage policy keys on the first path segment.
  const path = `${userId}/${applicationId}/${randomId()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: existing } = await supabase
    .from("student_applications")
    .select("documents")
    .eq("id", applicationId)
    .single();

  const documents = Array.isArray(existing?.documents) ? existing.documents : [];
  const next = [
    ...documents.filter((doc) => doc?.key !== docKey),
    toSnakeDocument({
      key: docKey,
      label: docLabel,
      storagePath: path,
      fileName: file.name,
      mimeType: file.type || "",
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    }),
  ];

  const { data, error } = await supabase
    .from("student_applications")
    .update({ documents: next })
    .eq("id", applicationId)
    .select(ROW_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

/** @param {string} applicationId @param {string} storagePath */
export async function removeApplicationDocument(applicationId, storagePath) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  await supabase.storage.from(DOCUMENT_BUCKET).remove([storagePath]);
  const { data: existing } = await supabase
    .from("student_applications")
    .select("documents")
    .eq("id", applicationId)
    .single();
  const next = (Array.isArray(existing?.documents) ? existing.documents : []).filter(
    (doc) => doc?.storage_path !== storagePath,
  );
  const { data, error } = await supabase
    .from("student_applications")
    .update({ documents: next })
    .eq("id", applicationId)
    .select(ROW_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

/** @param {string} id */
export async function submitHostedApplication(id) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  const { data, error } = await supabase.rpc("submit_student_application", { p_application_id: id });
  if (error) throw new Error(error.message);
  return toCamel(Array.isArray(data) ? data[0] : data);
}

/**
 * Student-set status, for records the institution does not own.
 * @param {string} id
 * @param {ApplicationStatus} status
 */
export async function setSelfManagedStatus(id, status) {
  if (!SELF_MANAGED_STATUSES.includes(status)) throw new Error("Unsupported status.");
  const supabase = getSupabase();
  const userId = await currentUserId();

  if (!supabase || !userId || String(id).startsWith("local-")) {
    const current = getLocalApplications();
    const row = current.find((item) => item.id === id);
    if (!row) return null;
    const next = { ...row, status, externalConfirmed: true, updatedAt: new Date().toISOString() };
    upsertLocalApplication(next);
    return next;
  }

  const { data, error } = await supabase
    .from("student_applications")
    .update({ status, external_confirmed: true })
    .eq("id", id)
    .select(ROW_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

/** @param {string} id */
export async function confirmExternalApplication(id) {
  const supabase = getSupabase();
  const userId = await currentUserId();
  if (!supabase || !userId || String(id).startsWith("local-")) {
    const row = getLocalApplications().find((item) => item.id === id);
    if (!row) return null;
    const next = { ...row, externalConfirmed: true, updatedAt: new Date().toISOString() };
    upsertLocalApplication(next);
    return next;
  }
  const { data, error } = await supabase
    .from("student_applications")
    .update({ external_confirmed: true })
    .eq("id", id)
    .select(ROW_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

/** @param {string} id */
export async function withdrawApplication(id) {
  const supabase = getSupabase();
  const userId = await currentUserId();
  if (!supabase || !userId || String(id).startsWith("local-")) {
    removeLocalApplication(id);
    return null;
  }
  const { data, error } = await supabase
    .from("student_applications")
    .update({ status: "withdrawn" })
    .eq("id", id)
    .select(ROW_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

/**
 * Carry anything tracked while signed out into the account, then clear local storage. Duplicates
 * are dropped by the one-live-application unique index rather than by guessing here.
 */
export async function mergeLocalApplicationsToCloud() {
  const supabase = getSupabase();
  const userId = await currentUserId();
  const local = getLocalApplications();
  if (!supabase || !userId || !local.length) return { merged: 0 };

  const rows = local.map((row) => ({
    user_id: userId,
    institution_id: row.institutionId,
    institution_name: (row.institutionName || "").slice(0, 200),
    programme_id: row.programmeId || null,
    programme_name: (row.programmeName || "").slice(0, 200),
    // Anything tracked offline is bookkeeping, never a hosted submission.
    channel: "manual",
    status: SELF_MANAGED_STATUSES.includes(row.status) ? row.status : "pending",
    external_url: row.externalUrl || null,
    external_click_count: Number(row.externalClickCount || 0),
    external_confirmed: Boolean(row.externalConfirmed),
    deadline: row.deadline || null,
    student_note: (row.studentNote || "").slice(0, 1000),
    source: "manual",
  }));

  const { error } = await supabase.from("student_applications").insert(rows);
  if (error && !/duplicate key/i.test(error.message)) {
    console.warn("Could not merge local applications:", error.message);
    return { merged: 0 };
  }
  clearLocalApplications();
  return { merged: rows.length };
}

// ---------------------------------------------------------------------------
// Institution side — kept here so both Vite entries share one module
// ---------------------------------------------------------------------------

/**
 * @param {string} institutionId
 * @param {{ status?: string, limit?: number }} [options]
 */
export async function fetchInstitutionApplications(institutionId, options = {}) {
  const supabase = getSupabase();
  if (!supabase || !institutionId) return [];
  let query = supabase
    .from("student_applications")
    .select(ROW_COLUMNS)
    .eq("institution_id", institutionId)
    .eq("channel", "hosted")
    .neq("status", "draft")
    .order("submitted_at", { ascending: false })
    .limit(options.limit || 200);
  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) {
    console.warn("Institution applications fetch failed:", error.message);
    return [];
  }
  return (data || []).map((row) => toCamel(row));
}

/**
 * @param {string} applicationId
 * @param {ApplicationStatus} status
 * @param {{ message?: string, referenceCode?: string }} [options]
 */
export async function updateApplicationStatus(applicationId, status, options = {}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  if (!CMS_STATUS_TABS.includes(status)) throw new Error("Unsupported status.");

  const { data: previous } = await supabase
    .from("student_applications")
    .select("status")
    .eq("id", applicationId)
    .single();

  const update = { status };
  if (options.message != null) update.institution_message = String(options.message).slice(0, 1500);
  if (options.referenceCode != null) update.reference_code = String(options.referenceCode).slice(0, 60);

  const { data, error } = await supabase
    .from("student_applications")
    .update(update)
    .eq("id", applicationId)
    .select(ROW_COLUMNS)
    .single();
  if (error) throw new Error(error.message);

  const { data: sessionData } = await supabase.auth.getSession();
  await supabase.from("student_application_events").insert({
    application_id: applicationId,
    actor_id: sessionData?.session?.user?.id ?? null,
    actor_role: "institution",
    event_type: "status_changed",
    from_status: previous?.status ?? null,
    to_status: status,
    message: String(options.message || "").slice(0, 1500),
  });

  return toCamel(data);
}

/** @param {string} applicationId @param {string} note */
export async function addInternalNote(applicationId, note) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from("student_application_events").insert({
    application_id: applicationId,
    actor_id: sessionData?.session?.user?.id ?? null,
    actor_role: "institution",
    event_type: "note",
    message: String(note || "").slice(0, 1500),
    visible_to_student: false,
  });
  if (error) throw new Error(error.message);
}

/** @param {string} institutionId @param {Partial<ApplicationSettings>} patch */
export async function saveApplicationSettings(institutionId, patch) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  const payload = { institution_id: institutionId };
  if (patch.acceptsHosted != null) payload.accepts_hosted_applications = Boolean(patch.acceptsHosted);
  if (patch.applicationsOpen != null) payload.applications_open = Boolean(patch.applicationsOpen);
  if (patch.externalApplyUrl !== undefined) payload.external_apply_url = patch.externalApplyUrl || null;
  if (patch.feeAmount !== undefined) {
    const amount = Number(patch.feeAmount);
    payload.application_fee_amount = Number.isFinite(amount) && amount >= 0 ? amount : null;
  }
  if (patch.feeCurrency) payload.application_fee_currency = String(patch.feeCurrency).slice(0, 3).toUpperCase();
  if (patch.feeNote != null) payload.application_fee_note = String(patch.feeNote).slice(0, 500);
  if (patch.requiredFields) payload.required_fields = patch.requiredFields;
  if (patch.requiredDocuments) payload.required_documents = patch.requiredDocuments;
  if (patch.maxProgrammeChoices) payload.max_programme_choices = Number(patch.maxProgrammeChoices);
  if (patch.instructions != null) payload.instructions = String(patch.instructions).slice(0, 2000);
  if (patch.notifyEmail !== undefined) payload.notify_email = patch.notifyEmail || null;

  const { data, error } = await supabase
    .from("institution_application_settings")
    .upsert(payload, { onConflict: "institution_id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return settingsToCamel(data);
}

/**
 * Counts shaped to drop straight into the partner dashboard's status bars.
 * @param {StudentApplication[]} rows
 */
export function summarizeApplications(rows) {
  const byStatus = countApplicationsByStatus(rows);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const priorWeekStart = weekAgo - 7 * 24 * 60 * 60 * 1000;
  let newThisWeek = 0;
  let priorWeek = 0;
  for (const row of rows || []) {
    const at = Date.parse(row.submittedAt || row.createdAt || "");
    if (!Number.isFinite(at)) continue;
    if (at >= weekAgo) newThisWeek += 1;
    else if (at >= priorWeekStart) priorWeek += 1;
  }
  return { total: (rows || []).length, byStatus, newThisWeek, priorWeek };
}

/** True when application features can talk to a backend at all. */
export function applicationsCloudReady() {
  return isSupabaseConfigured();
}
