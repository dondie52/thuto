import { getSupabase, isSupabaseConfigured } from "./supabase.js";
import { isPremiumActive } from "./premium.js";
import {
  CENTER_DOCUMENT_TYPES,
  CENTER_MAX_FILE_BYTES,
  CENTER_POLICY_VERSION,
  CENTER_UPLOAD_REWARD_CREDITS,
  CENTER_UNLOCK_COST_CREDITS,
} from "./thutoCenterPolicy.js";

export { isSupabaseConfigured };
export {
  CENTER_DOCUMENT_TYPES,
  CENTER_FACULTIES,
  CENTER_REPORT_REASONS,
  CENTER_STATUS_LABELS,
  CENTER_POLICY,
  CENTER_POLICY_VERSION,
  CENTER_UPLOAD_REWARD_CREDITS,
  CENTER_UNLOCK_COST_CREDITS,
  CENTER_MAX_FILE_BYTES,
} from "./thutoCenterPolicy.js";

const DOCUMENT_SELECT =
  "id,uploader_id,title,description,document_type,university_id,university_name,faculty,course_code,academic_year,exam_session,storage_path,file_name,file_size,mime_type,page_count,status,source,moderation_reason,download_count,helpful_count,report_count,published_at,created_at,updated_at";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function assertSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Thuto Center is unavailable until Supabase is configured.");
  return supabase;
}

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeFileName(name) {
  const clean = String(name || "document")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return clean || "document";
}

function normalizeDocument(row, extras = {}) {
  if (!row) return null;
  return {
    id: row.id,
    uploaderId: row.uploader_id,
    title: row.title || "",
    description: row.description || "",
    documentType: row.document_type || "other",
    universityId: row.university_id || "",
    universityName: row.university_name || "",
    faculty: row.faculty || "",
    courseCode: row.course_code || "",
    academicYear: row.academic_year || "",
    examSession: row.exam_session || "",
    storagePath: row.storage_path || "",
    fileName: row.file_name || "",
    fileSize: row.file_size || 0,
    mimeType: row.mime_type || "",
    pageCount: row.page_count,
    status: row.status || "pending_review",
    source: row.source || "peer",
    moderationReason: row.moderation_reason || "",
    downloadCount: row.download_count || 0,
    helpfulCount: row.helpful_count || 0,
    reportCount: row.report_count || 0,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...extras,
  };
}

export function documentTypeLabel(value) {
  return CENTER_DOCUMENT_TYPES.find((item) => item.value === value)?.label || "Document";
}

export function formatFileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export async function fetchCenterDocuments({
  universityId = "",
  faculty = "",
  courseCode = "",
  documentType = "",
  source = "",
  search = "",
  limit = 60,
} = {}) {
  const supabase = assertSupabase();
  let query = supabase
    .from("center_documents")
    .select(DOCUMENT_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (universityId) query = query.eq("university_id", universityId);
  if (faculty) query = query.eq("faculty", faculty);
  if (documentType) query = query.eq("document_type", documentType);
  if (source) query = query.eq("source", source);
  if (courseCode.trim()) query = query.ilike("course_code", `%${courseCode.trim()}%`);
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term},course_code.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => normalizeDocument(row));
}

export async function fetchTopCenterSpotlights(limit = 3) {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("center_documents")
      .select(DOCUMENT_SELECT)
      .eq("status", "published")
      .order("helpful_count", { ascending: false })
      .order("download_count", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map((row) => normalizeDocument(row));
  } catch {
    return [];
  }
}

export async function fetchCenterDocument(documentId) {
  const supabase = assertSupabase();
  const { data, error } = await supabase
    .from("center_documents")
    .select(DOCUMENT_SELECT)
    .eq("id", documentId)
    .maybeSingle();
  if (error) throw error;
  return normalizeDocument(data);
}

export async function fetchMyCenterDocuments({ limit = 40 } = {}) {
  const supabase = assertSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return [];

  const { data, error } = await supabase
    .from("center_documents")
    .select(DOCUMENT_SELECT)
    .eq("uploader_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((row) => normalizeDocument(row));
}

export async function fetchCenterCredits() {
  const supabase = assertSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 };

  const { data, error } = await supabase
    .from("center_upload_credits")
    .select("credits_balance,lifetime_earned,lifetime_spent")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;

  return {
    balance: data?.credits_balance || 0,
    lifetimeEarned: data?.lifetime_earned || 0,
    lifetimeSpent: data?.lifetime_spent || 0,
  };
}

export async function fetchUnlockedDocumentIds() {
  const supabase = assertSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return new Set();

  const { data, error } = await supabase.from("center_unlocks").select("document_id").eq("user_id", user.id);
  if (error) throw error;
  return new Set((data || []).map((row) => row.document_id));
}

export async function hasAcceptedCenterPolicy() {
  const supabase = assertSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return false;

  const { data, error } = await supabase
    .from("center_policy_acceptances")
    .select("policy_version")
    .eq("user_id", user.id)
    .eq("policy_version", CENTER_POLICY_VERSION)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function acceptCenterPolicy() {
  const supabase = assertSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Sign in to accept the Thuto Center policy.");

  const { error } = await supabase.from("center_policy_acceptances").upsert(
    {
      user_id: user.id,
      policy_version: CENTER_POLICY_VERSION,
      accepted_at: new Date().toISOString(),
    },
    { onConflict: "user_id,policy_version" },
  );
  if (error) throw error;
}

export async function uploadCenterDocument({
  file,
  title,
  description = "",
  documentType,
  universityId,
  universityName,
  faculty,
  courseCode,
  academicYear = "",
  examSession = "",
}) {
  const supabase = assertSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Sign in to upload to Thuto Center.");

  if (!file) throw new Error("Choose a file to upload.");
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("File type not allowed. Use PDF, Word, JPEG, PNG, or WebP.");
  }
  if (file.size > CENTER_MAX_FILE_BYTES) {
    throw new Error("File is too large. Maximum size is 15 MB.");
  }
  if (!title?.trim()) throw new Error("Add a title for your document.");
  if (!universityId?.trim()) throw new Error("Select your university.");
  if (!faculty?.trim()) throw new Error("Select a faculty.");
  if (!courseCode?.trim()) throw new Error("Add a course code.");

  const documentId = randomId();
  const path = `${user.id}/${documentId}/${safeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage.from("thuto-center-docs").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("center_documents")
    .insert({
      id: documentId,
      uploader_id: user.id,
      title: title.trim(),
      description: description.trim(),
      document_type: documentType,
      university_id: universityId.trim(),
      university_name: universityName?.trim() || "",
      faculty: faculty.trim(),
      course_code: courseCode.trim().toUpperCase(),
      academic_year: academicYear.trim() || null,
      exam_session: examSession.trim() || null,
      storage_path: path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      status: "pending_review",
      policy_version: CENTER_POLICY_VERSION,
      policy_accepted_at: new Date().toISOString(),
      copyright_declaration: true,
    })
    .select(DOCUMENT_SELECT)
    .single();

  if (error) {
    await supabase.storage.from("thuto-center-docs").remove([path]);
    throw error;
  }

  return normalizeDocument(data);
}

/**
 * Admin upload — publishes immediately as an official curated document (no moderation queue).
 */
export async function uploadAdminCenterDocument({
  file,
  title,
  description = "",
  documentType,
  universityId,
  universityName,
  faculty,
  courseCode,
  academicYear = "",
  examSession = "",
}) {
  const supabase = assertSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Admin sign-in required.");

  if (!file) throw new Error("Choose a file to upload.");
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("File type not allowed. Use PDF, Word, JPEG, PNG, or WebP.");
  }
  if (file.size > CENTER_MAX_FILE_BYTES) {
    throw new Error("File is too large. Maximum size is 15 MB.");
  }
  if (!title?.trim()) throw new Error("Add a title for the document.");
  if (!universityId?.trim()) throw new Error("Select a university.");
  if (!faculty?.trim()) throw new Error("Select a faculty.");
  if (!courseCode?.trim()) throw new Error("Add a course code.");

  const documentId = randomId();
  const path = `${user.id}/${documentId}/${safeFileName(file.name)}`;
  const now = new Date().toISOString();

  const { error: uploadError } = await supabase.storage.from("thuto-center-docs").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("center_documents")
    .insert({
      id: documentId,
      uploader_id: user.id,
      title: title.trim(),
      description: description.trim(),
      document_type: documentType,
      university_id: universityId.trim(),
      university_name: universityName?.trim() || "",
      faculty: faculty.trim(),
      course_code: courseCode.trim().toUpperCase(),
      academic_year: academicYear.trim() || null,
      exam_session: examSession.trim() || null,
      storage_path: path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      status: "published",
      source: "official",
      published_at: now,
      policy_version: CENTER_POLICY_VERSION,
      policy_accepted_at: now,
      copyright_declaration: true,
    })
    .select(DOCUMENT_SELECT)
    .single();

  if (error) {
    await supabase.storage.from("thuto-center-docs").remove([path]);
    throw error;
  }

  return normalizeDocument(data);
}

export async function unlockCenterDocument(documentId) {
  const supabase = assertSupabase();
  const { data, error } = await supabase.rpc("center_unlock_document", { p_document_id: documentId });
  if (error) throw error;
  return data;
}

export async function canDownloadCenterDocument(documentId, profile) {
  if (isPremiumActive(profile)) return true;
  const supabase = assertSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return false;

  const doc = await fetchCenterDocument(documentId);
  if (!doc) return false;
  if (doc.source === "official") return true;
  if (doc.uploaderId === user.id) return true;

  const { data, error } = await supabase.rpc("center_user_can_download", {
    p_user_id: user.id,
    p_document_id: documentId,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function getCenterDownloadUrl(documentId, profile) {
  const supabase = assertSupabase();
  const allowed = await canDownloadCenterDocument(documentId, profile);
  if (!allowed) {
    throw new Error("Unlock this document or upgrade to Thuto Pro to download.");
  }

  const doc = await fetchCenterDocument(documentId);
  if (!doc?.storagePath) throw new Error("Document file not found.");

  const { data, error } = await supabase.storage
    .from("thuto-center-docs")
    .createSignedUrl(doc.storagePath, 120);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error("Could not prepare download.");

  await supabase.rpc("center_record_download", { p_document_id: documentId });
  return { url: data.signedUrl, fileName: doc.fileName };
}

export async function toggleCenterHelpful(documentId) {
  const supabase = assertSupabase();
  const { data, error } = await supabase.rpc("center_toggle_helpful", { p_document_id: documentId });
  if (error) throw error;
  return data;
}

export async function reportCenterDocument({ documentId, reason, details = "" }) {
  const supabase = assertSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Sign in to report a document.");

  const { error: insertError } = await supabase.from("center_reports").insert({
    document_id: documentId,
    reporter_id: user.id,
    reason,
    details: details.trim(),
  });
  if (insertError) throw insertError;

  const { data: row } = await supabase
    .from("center_documents")
    .select("report_count")
    .eq("id", documentId)
    .maybeSingle();

  if (row) {
    await supabase
      .from("center_documents")
      .update({ report_count: (row.report_count || 0) + 1 })
      .eq("id", documentId);
  }

  return { ok: true };
}

export async function fetchAdminCenterDocuments({ status = "pending_review", limit = 120 } = {}) {
  const supabase = assertSupabase();
  let query = supabase
    .from("center_documents")
    .select(`${DOCUMENT_SELECT},admin_note,reviewed_at,moderation_reason`)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => normalizeDocument(row, { adminNote: row.admin_note || "" }));
}

export async function moderateCenterDocument({ documentId, action, adminNote = "", moderationReason = "" }) {
  const supabase = assertSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Admin sign-in required.");

  const patch = {
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    admin_note: adminNote.trim() || null,
    moderation_reason: moderationReason.trim() || null,
  };

  if (action === "approve") {
    Object.assign(patch, {
      status: "published",
      published_at: new Date().toISOString(),
      removed_at: null,
    });
  } else if (action === "reject") {
    Object.assign(patch, { status: "rejected" });
  } else if (action === "remove") {
    Object.assign(patch, {
      status: "removed",
      removed_at: new Date().toISOString(),
    });
  } else if (action === "restore") {
    Object.assign(patch, {
      status: "published",
      published_at: new Date().toISOString(),
      removed_at: null,
    });
  } else {
    throw new Error("Unknown moderation action.");
  }

  const { data, error } = await supabase
    .from("center_documents")
    .update(patch)
    .eq("id", documentId)
    .select(DOCUMENT_SELECT)
    .single();
  if (error) throw error;
  return normalizeDocument(data);
}

export async function fetchCenterReports({ limit = 80 } = {}) {
  const supabase = assertSupabase();
  const { data, error } = await supabase
    .from("center_reports")
    .select("id,document_id,reporter_id,reason,details,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
