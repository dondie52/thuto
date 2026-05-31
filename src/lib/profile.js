import { getSupabase, isSupabaseConfigured } from "./supabase.js";

export { isSupabaseConfigured };

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_DISTINCTION = 120;

export const UNIVERSITY_STATUS_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "studying", label: "I study here" },
  { value: "aspiring", label: "I hope to study here" },
];

function assertSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Profile editing is unavailable until Supabase is configured.");
  return supabase;
}

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeFileName(name) {
  const clean = String(name || "avatar")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return clean || "avatar";
}

export function normalizeProfileRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name || "",
    avatar_url: row.avatar_url || "",
    university_id: row.university_id || "",
    university_name: row.university_name || "",
    university_status: row.university_status || "",
    distinction: row.distinction || "",
    stripe_customer_id: row.stripe_customer_id || null,
    payment_provider: row.payment_provider || "stripe",
    premium_status: row.premium_status || "free",
    premium_plan: row.premium_plan || null,
    premium_until: row.premium_until || null,
  };
}

export function universityStatusLabel(status) {
  if (status === "studying") return "Studies at";
  if (status === "aspiring") return "Hopeful at";
  return "";
}

export function formatAuthorUniversity({ universityName, universityStatus }) {
  const name = String(universityName || "").trim();
  if (!name) return "";
  const prefix = universityStatusLabel(universityStatus);
  return prefix ? `${prefix} ${name}` : name;
}

export async function uploadProfileAvatar(file) {
  const supabase = assertSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Sign in to upload a profile picture.");

  if (!file?.type?.startsWith("image/")) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Profile picture must be 2MB or smaller.");
  }

  const path = `${user.id}/${Date.now()}-${randomId()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("profile-avatars").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * @param {{
 *   fullName?: string,
 *   universityId?: string,
 *   universityName?: string,
 *   universityStatus?: string,
 *   distinction?: string,
 *   avatarUrl?: string,
 * }} patch
 */
export async function updateUserProfile(patch) {
  const supabase = assertSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Sign in to update your profile.");

  const updates = {};
  if (patch.fullName !== undefined) {
    updates.full_name = String(patch.fullName || "").trim().slice(0, 80);
  }
  if (patch.universityId !== undefined) {
    updates.university_id = String(patch.universityId || "").trim().slice(0, 80) || null;
  }
  if (patch.universityName !== undefined) {
    updates.university_name = String(patch.universityName || "").trim().slice(0, 120) || null;
  }
  if (patch.universityStatus !== undefined) {
    const status = String(patch.universityStatus || "").trim();
    updates.university_status = status === "studying" || status === "aspiring" ? status : null;
  }
  if (patch.distinction !== undefined) {
    updates.distinction = String(patch.distinction || "").trim().slice(0, MAX_DISTINCTION) || null;
  }
  if (patch.avatarUrl !== undefined) {
    updates.avatar_url = String(patch.avatarUrl || "").trim().slice(0, 1000) || null;
  }

  if (!Object.keys(updates).length) {
    const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    return normalizeProfileRow(existing);
  }

  const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select("*").single();
  if (error) throw error;

  if (updates.full_name !== undefined) {
    await supabase.auth.updateUser({
      data: { full_name: updates.full_name || "" },
    });
  }

  return normalizeProfileRow(data);
}
