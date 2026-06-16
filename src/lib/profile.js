import { getSupabase, isSupabaseConfigured } from "./supabase.js";

export { isSupabaseConfigured };

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_DISTINCTION = 120;
const MAX_BIO = 150;

const PROFILE_SELECT =
  "id, full_name, username, bio, avatar_url, university_id, university_name, university_status, distinction, syllabus_type, sponsorship_intent, fields_of_interest, message_privacy, onboarding_completed_at, onboarding_skipped_at, stripe_customer_id, payment_provider, premium_status, premium_plan, premium_until";

function isProfileUpdateRpcMissing(error) {
  const code = String(error?.code || "").trim();
  const message = String(error?.message || "").trim();
  return (
    code === "42883" ||
    code === "PGRST202" ||
    /function.*update_own_profile/i.test(message) ||
    /could not find the function/i.test(message)
  );
}

export const PROFILE_SCHEMA_UNAVAILABLE_MESSAGE =
  "Profile save is temporarily unavailable while Supabase refreshes its schema. Wait about a minute and try again.";

function isProfileSchemaCacheError(error) {
  const code = String(error?.code || "").trim();
  const message = String(error?.message || "").trim();
  return (
    /profiles/i.test(message) &&
    (/schema cache/i.test(message) ||
      /could not find the ['"]?bio['"]? column/i.test(message) ||
      code === "PGRST204")
  );
}

function profileSchemaUnavailableError(error) {
  return Object.assign(new Error(PROFILE_SCHEMA_UNAVAILABLE_MESSAGE), {
    cause: error,
    profileSchemaUnavailable: true,
  });
}

export function isProfileSchemaUnavailableError(error) {
  return Boolean(error?.profileSchemaUnavailable) || String(error?.message || "").trim() === PROFILE_SCHEMA_UNAVAILABLE_MESSAGE;
}

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

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string | null} full_name
 * @property {string | null} username
 * @property {string | null} bio
 * @property {string | null} avatar_url
 * @property {string | null} university_id
 * @property {string | null} university_name
 * @property {'studying' | 'aspiring' | null} university_status
 * @property {string | null} distinction
 * @property {'bgcse' | 'igcse' | 'as_level' | 'o_level' | null} syllabus_type
 * @property {'dtef' | 'private' | 'self_funded' | null} sponsorship_intent
 * @property {string[]} fields_of_interest
 * @property {string | null} onboarding_completed_at
 * @property {string | null} onboarding_skipped_at
 * @property {string | null} stripe_customer_id
 * @property {string} payment_provider
 * @property {'free' | 'active' | 'past_due' | 'canceled'} premium_status
 * @property {'monthly' | 'annual' | 'season_pass' | null} premium_plan
 * @property {string | null} premium_until
 */

export function normalizeProfileRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name || "",
    username: row.username || "",
    bio: row.bio || "",
    avatar_url: row.avatar_url || "",
    university_id: row.university_id || "",
    university_name: row.university_name || "",
    university_status: row.university_status || "",
    distinction: row.distinction || "",
    syllabus_type: row.syllabus_type || "",
    sponsorship_intent: row.sponsorship_intent || "",
    fields_of_interest: Array.isArray(row.fields_of_interest) ? row.fields_of_interest : [],
    message_privacy: row.message_privacy || "everyone",
    onboarding_completed_at: row.onboarding_completed_at || null,
    onboarding_skipped_at: row.onboarding_skipped_at || null,
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
 *   username?: string,
 *   bio?: string,
 *   universityId?: string,
 *   universityName?: string,
 *   universityStatus?: string,
 *   distinction?: string,
 *   avatarUrl?: string,
 *   syllabusType?: string,
 *   sponsorshipIntent?: string,
 *   fieldsOfInterest?: string[],
 *   messagePrivacy?: string,
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
  if (patch.username !== undefined) {
    updates.username = String(patch.username || "").trim().toLowerCase() || null;
  }
  if (patch.bio !== undefined) {
    updates.bio = String(patch.bio || "").trim().slice(0, MAX_BIO) || null;
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
  if (patch.syllabusType !== undefined) {
    const syllabus = String(patch.syllabusType || "").trim();
    updates.syllabus_type =
      syllabus === "bgcse" || syllabus === "igcse" || syllabus === "as_level" || syllabus === "o_level"
        ? syllabus
        : null;
  }
  if (patch.sponsorshipIntent !== undefined) {
    const intent = String(patch.sponsorshipIntent || "").trim();
    updates.sponsorship_intent = intent === "dtef" || intent === "private" || intent === "self_funded" ? intent : null;
  }
  if (patch.fieldsOfInterest !== undefined) {
    updates.fields_of_interest = Array.isArray(patch.fieldsOfInterest)
      ? [...new Set(patch.fieldsOfInterest.map((value) => String(value).trim()).filter(Boolean))].slice(0, 8)
      : [];
  }
  if (patch.messagePrivacy !== undefined) {
    const privacy = String(patch.messagePrivacy || "").trim();
    updates.message_privacy =
      privacy === "connections_only" || privacy === "followers_only" ? privacy : "everyone";
  }

  if (!Object.keys(updates).length) {
    const { data: existing } = await supabase.from("profiles").select(PROFILE_SELECT).eq("id", user.id).maybeSingle();
    return normalizeProfileRow(existing);
  }

  let data;
  const { data: rpcData, error: rpcError } = await supabase.rpc("update_own_profile", { patch: updates });
  if (rpcError) {
    if (isProfileUpdateRpcMissing(rpcError)) {
      const { data: directData, error: directError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select(PROFILE_SELECT)
        .single();
      if (directError) {
        if (isProfileSchemaCacheError(directError)) {
          throw profileSchemaUnavailableError(directError);
        }
        throw directError;
      }
      data = directData;
    } else if (isProfileSchemaCacheError(rpcError)) {
      throw profileSchemaUnavailableError(rpcError);
    } else {
      throw rpcError;
    }
  } else {
    data = rpcData;
  }

  if (updates.full_name !== undefined) {
    await supabase.auth.updateUser({
      data: { full_name: updates.full_name || "" },
    });
  }

  return normalizeProfileRow(data);
}
