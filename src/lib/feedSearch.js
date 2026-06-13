import { getSupabase } from "./supabase.js";
import { searchProfiles } from "./people.js";

function assertSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Feed search is unavailable until Supabase is configured.");
  return supabase;
}

function normalizePost(row) {
  return {
    id: row.id,
    title: row.title || "",
    body: row.body || "",
    category: row.category || "general",
    authorDisplayName: row.author_display_name || "Student",
    authorUsername: row.author_username || "",
    authorAvatarUrl: row.author_avatar_url || "",
    publishedAt: row.published_at || row.created_at,
  };
}

/**
 * @param {string} query
 * @param {{ limit?: number }} [options]
 */
export async function searchFeedPosts(query, { limit = 20 } = {}) {
  const supabase = assertSupabase();
  const term = String(query || "").trim();
  if (!term) return [];

  const pattern = `%${term.replace(/[%_]/g, "")}%`;
  const { data, error } = await supabase
    .from("feed_posts")
    .select("id,title,body,category,author_display_name,author_username,author_avatar_url,published_at,created_at")
    .eq("status", "published")
    .or(`title.ilike.${pattern},body.ilike.${pattern},author_display_name.ilike.${pattern},author_username.ilike.${pattern}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(normalizePost);
}

/**
 * @param {string} query
 * @param {{ limit?: number }} [options]
 */
export async function searchFeed(query, { limit = 20 } = {}) {
  const [posts, people] = await Promise.all([
    searchFeedPosts(query, { limit }),
    searchProfiles(query, { limit }),
  ]);
  return { posts, people };
}
