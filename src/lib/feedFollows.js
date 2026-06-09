import { getSupabase } from "./supabase.js";

function assertSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Follows are unavailable until Supabase is configured.");
  return supabase;
}

async function currentUserId() {
  const supabase = assertSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error("Sign in to follow people.");
  return data.user.id;
}

/**
 * @param {string} followingId
 */
export async function followUser(followingId) {
  const supabase = assertSupabase();
  const followerId = await currentUserId();
  if (followerId === followingId) throw new Error("You cannot follow yourself.");

  const { error } = await supabase.from("user_follows").insert({
    follower_id: followerId,
    following_id: followingId,
  });
  if (error?.code === "23505") return;
  if (error) throw error;
}

/**
 * @param {string} followingId
 */
export async function unfollowUser(followingId) {
  const supabase = assertSupabase();
  const followerId = await currentUserId();

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
}

/**
 * @param {string} followingId
 */
export async function toggleFollowUser(followingId) {
  const following = await isFollowingUser(followingId);
  if (following) {
    await unfollowUser(followingId);
    return false;
  }
  await followUser(followingId);
  return true;
}

/**
 * @param {string} followingId
 */
export async function isFollowingUser(followingId) {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) return false;

  const { data, error } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", authData.user.id)
    .eq("following_id", followingId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

/**
 * @param {string[]} authorIds
 * @returns {Promise<Set<string>>}
 */
export async function fetchFollowingSet(authorIds = []) {
  const supabase = getSupabase();
  const ids = [...new Set(authorIds.filter(Boolean))];
  if (!supabase || !ids.length) return new Set();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) return new Set();

  const { data, error } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", authData.user.id)
    .in("following_id", ids);
  if (error) return new Set();

  return new Set((data || []).map((row) => row.following_id));
}
