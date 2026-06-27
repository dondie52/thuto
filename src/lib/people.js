import { getSupabase } from "./supabase.js";
import { formatAuthorUniversity } from "./profile.js";
import { profileRowIsPro, PROFILE_PRO_FIELDS } from "./proStatus.js";

function assertSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("People are unavailable until Supabase is configured.");
  return supabase;
}

async function currentUserId() {
  const supabase = assertSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id || null;
}

function normalizePerson(row) {
  if (!row) return null;
  const profile = row.profile || row;
  return {
    id: profile.id,
    fullName: profile.full_name?.trim() || "Student",
    username: profile.username?.trim() || "",
    avatarUrl: profile.avatar_url || "",
    bio: profile.bio?.trim() || "",
    universityLine: formatAuthorUniversity({
      universityName: profile.university_name,
      universityStatus: profile.university_status,
    }),
    isPro: profileRowIsPro(profile),
  };
}

const PROFILE_COLUMNS = `id,full_name,username,bio,avatar_url,university_name,university_status,${PROFILE_PRO_FIELDS}`;

/**
 * @param {string} query
 * @param {{ limit?: number }} [options]
 */
export async function searchProfiles(query, { limit = 20 } = {}) {
  const supabase = assertSupabase();
  const term = String(query || "").trim();
  if (!term) return [];

  const pattern = `%${term.replace(/[%_]/g, "")}%`;
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .or(`username.ilike.${pattern},full_name.ilike.${pattern},university_name.ilike.${pattern}`)
    .not("username", "is", null)
    .neq("username", "")
    .order("full_name", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(normalizePerson).filter(Boolean);
}

/**
 * @param {{ limit?: number }} [options]
 */
export async function fetchFollowingProfiles({ limit = 40 } = {}) {
  const supabase = assertSupabase();
  const userId = await currentUserId();
  if (!userId) return [];

  const { data: follows, error } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const ids = (follows || []).map((row) => row.following_id).filter(Boolean);
  if (!ids.length) return [];

  const { data: profiles, error: profileError } = await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", ids);
  if (profileError) throw profileError;

  const byId = new Map((profiles || []).map((row) => [row.id, row]));
  return ids.map((id) => normalizePerson(byId.get(id))).filter(Boolean);
}

/**
 * @param {{ limit?: number }} [options]
 */
export async function fetchFollowerProfiles({ limit = 40 } = {}) {
  const supabase = assertSupabase();
  const userId = await currentUserId();
  if (!userId) return [];

  const { data: follows, error } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const ids = (follows || []).map((row) => row.follower_id).filter(Boolean);
  if (!ids.length) return [];

  const { data: profiles, error: profileError } = await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", ids);
  if (profileError) throw profileError;

  const byId = new Map((profiles || []).map((row) => [row.id, row]));
  return ids.map((id) => normalizePerson(byId.get(id))).filter(Boolean);
}

/**
 * @param {{ limit?: number }} [options]
 */
export async function fetchDiscoverProfiles({ limit = 24 } = {}) {
  const supabase = assertSupabase();
  const userId = await currentUserId();
  if (!userId) return [];

  const { data: followingRows } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", userId);
  const exclude = new Set([userId, ...(followingRows || []).map((row) => row.following_id)]);

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .not("username", "is", null)
    .neq("username", "")
    .order("onboarding_completed_at", { ascending: false, nullsFirst: false })
    .limit(limit + exclude.size);
  if (error) throw error;

  return (data || [])
    .filter((row) => !exclude.has(row.id))
    .slice(0, limit)
    .map(normalizePerson)
    .filter(Boolean);
}

/**
 * @param {string[]} userIds
 */
export async function fetchFollowingSetForUsers(userIds = []) {
  const supabase = getSupabase();
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!supabase || !ids.length) return new Set();

  const userId = await currentUserId();
  if (!userId) return new Set();

  const { data, error } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", userId)
    .in("following_id", ids);
  if (error) return new Set();
  return new Set((data || []).map((row) => row.following_id));
}
