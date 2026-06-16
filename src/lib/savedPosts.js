import { getSupabase } from "./supabase.js";

const STORAGE_KEY = "thuto-saved-feed-posts";

function readLocalSavedSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

function writeLocalSavedSet(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota errors */
  }
}

function isMissingTableError(error) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

async function currentUserId() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

/**
 * @param {string[]} postIds
 */
export async function fetchSavedPostSet(postIds = []) {
  const ids = [...new Set(postIds.filter(Boolean))];
  if (!ids.length) return new Set();

  const supabase = getSupabase();
  const userId = await currentUserId();
  if (!supabase || !userId) return readLocalSavedSet();

  const { data, error } = await supabase.from("saved_posts").select("post_id").eq("user_id", userId).in("post_id", ids);
  if (error) {
    if (isMissingTableError(error)) return readLocalSavedSet();
    throw error;
  }
  return new Set((data || []).map((row) => row.post_id));
}

/**
 * @param {string} postId
 */
export async function toggleSavedPost(postId) {
  if (!postId) throw new Error("Post is required.");

  const supabase = getSupabase();
  const userId = await currentUserId();
  if (!supabase || !userId) {
    const saved = readLocalSavedSet();
    if (saved.has(postId)) saved.delete(postId);
    else saved.add(postId);
    writeLocalSavedSet(saved);
    return saved.has(postId);
  }

  const { data: existing, error: readError } = await supabase
    .from("saved_posts")
    .select("post_id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .maybeSingle();
  if (readError && !isMissingTableError(readError)) throw readError;

  if (readError && isMissingTableError(readError)) {
    const saved = readLocalSavedSet();
    if (saved.has(postId)) saved.delete(postId);
    else saved.add(postId);
    writeLocalSavedSet(saved);
    return saved.has(postId);
  }

  if (existing?.post_id) {
    const { error } = await supabase.from("saved_posts").delete().eq("user_id", userId).eq("post_id", postId);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from("saved_posts").insert({ user_id: userId, post_id: postId });
  if (error) throw error;
  return true;
}
