import { fetchPostsByAuthor } from "./feed.js";
import { isPremiumActive } from "./premium.js";
import { getSupabase } from "./supabase.js";
import { formatAuthorUniversity } from "./profile.js";

const PROFILE_COLUMNS =
  "id,full_name,username,bio,avatar_url,university_id,university_name,university_status,distinction,fields_of_interest,message_privacy,premium_status,premium_until";

function assertSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Profiles are unavailable until Supabase is configured.");
  return supabase;
}

function normalizePublicProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name?.trim() || "Student",
    username: row.username?.trim() || "",
    bio: row.bio?.trim() || "",
    avatarUrl: row.avatar_url || "",
    distinction: row.distinction?.trim() || "",
    fieldsOfInterest: Array.isArray(row.fields_of_interest) ? row.fields_of_interest : [],
    universityId: row.university_id || "",
    universityName: row.university_name?.trim() || "",
    universityStatus: row.university_status || "",
    universityLine: formatAuthorUniversity({
      universityName: row.university_name,
      universityStatus: row.university_status,
    }),
    messagePrivacy: row.message_privacy || "everyone",
    isPro: isPremiumActive(row),
  };
}

/**
 * @param {string} username
 */
export async function fetchProfileByUsername(username) {
  const supabase = assertSupabase();
  const value = String(username || "").trim().toLowerCase();
  if (!value) return null;

  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("username", value).maybeSingle();
  if (error) throw error;
  return normalizePublicProfile(data);
}

/**
 * @param {string} userId
 */
export async function fetchProfileCounts(userId) {
  const supabase = assertSupabase();
  if (!userId) return { followers: 0, following: 0 };

  const [followersResult, followingResult] = await Promise.all([
    supabase.from("user_follows").select("follower_id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("user_follows").select("following_id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);

  if (followersResult.error) throw followersResult.error;
  if (followingResult.error) throw followingResult.error;

  return {
    followers: followersResult.count || 0,
    following: followingResult.count || 0,
  };
}

export { fetchPostsByAuthor };
