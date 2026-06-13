import { getSupabase } from "./supabase.js";

function assertSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Notifications are unavailable until Supabase is configured.");
  return supabase;
}

async function currentUserId() {
  const supabase = assertSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error("Sign in to view notifications.");
  return data.user.id;
}

function isMissingTableError(error) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

function normalizeNotification(row) {
  return {
    id: row.id,
    type: row.type,
    actorId: row.actor_id,
    actorName: row.actor_display_name || "Someone",
    actorUsername: row.actor_username || "",
    actorAvatarUrl: row.actor_avatar_url || "",
    targetType: row.target_type || "",
    targetId: row.target_id || "",
    body: row.body || "",
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function fetchUnreadNotificationCount() {
  const supabase = getSupabase();
  if (!supabase) return 0;

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) return 0;

  const { count, error } = await supabase
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", authData.user.id)
    .is("read_at", null);
  if (error) {
    if (isMissingTableError(error)) return 0;
    throw error;
  }
  return count || 0;
}

/**
 * @param {{ limit?: number }} [options]
 */
export async function fetchNotifications({ limit = 40 } = {}) {
  const supabase = assertSupabase();
  const userId = await currentUserId();

  const { data, error } = await supabase
    .from("user_notifications")
    .select(
      "id,type,actor_id,actor_display_name,actor_username,actor_avatar_url,target_type,target_id,body,read_at,created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return (data || []).map(normalizeNotification);
}

/**
 * @param {string[]} ids
 */
export async function markNotificationsRead(ids = []) {
  const supabase = assertSupabase();
  const userId = await currentUserId();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return;

  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .in("id", unique);
  if (error && !isMissingTableError(error)) throw error;
}

export async function markAllNotificationsRead() {
  const supabase = assertSupabase();
  const userId = await currentUserId();

  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error && !isMissingTableError(error)) throw error;
}

export function notificationSummary(item) {
  if (item.body) return item.body;
  if (item.type === "follow") return `${item.actorName} started following you`;
  if (item.type === "connection_request") return `${item.actorName} sent you a connection request`;
  if (item.type === "connection_accepted") return `${item.actorName} accepted your connection request`;
  if (item.type === "comment") return `${item.actorName} commented on your post`;
  if (item.type === "reaction") return `${item.actorName} reacted to your post`;
  if (item.type === "mention") return `${item.actorName} mentioned you in a post`;
  return "New activity on your feed";
}
