import { getSupabase } from "./supabase.js";

function assertSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Messages are unavailable until Supabase is configured.");
  return supabase;
}

async function currentUserId() {
  const supabase = assertSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error("Sign in to view messages.");
  return data.user.id;
}

function isMissingTableError(error) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

function normalizeConversation(row) {
  return {
    id: row.id,
    otherUserId: row.other_user_id,
    otherName: row.other_display_name || "Student",
    otherUsername: row.other_username || "",
    otherAvatarUrl: row.other_avatar_url || "",
    lastMessage: row.last_message || "",
    lastMessageAt: row.last_message_at,
    unreadCount: row.unread_count || 0,
  };
}

function normalizeMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function fetchUnreadMessageCount() {
  const supabase = getSupabase();
  if (!supabase) return 0;

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) return 0;

  const { data, error } = await supabase.rpc("get_unread_message_count");
  if (!error) return Number(data) || 0;

  const { count, error: fallbackError } = await supabase
    .from("conversation_members")
    .select("conversation_id", { count: "exact", head: true })
    .eq("user_id", authData.user.id)
    .gt("unread_count", 0);
  if (fallbackError) {
    if (isMissingTableError(fallbackError)) return 0;
    return 0;
  }
  return count || 0;
}

/**
 * @param {{ limit?: number }} [options]
 */
export async function fetchConversations({ limit = 30 } = {}) {
  const supabase = assertSupabase();
  await currentUserId();

  const { data, error } = await supabase.rpc("list_my_conversations", { p_limit: limit });
  if (!error) return (data || []).map(normalizeConversation);

  if (isMissingTableError(error)) return [];
  throw error;
}

/**
 * @param {string} conversationId
 */
export async function fetchMessages(conversationId, { limit = 50 } = {}) {
  const supabase = assertSupabase();
  await currentUserId();

  const { data, error } = await supabase
    .from("messages")
    .select("id,conversation_id,sender_id,body,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return (data || []).map(normalizeMessage);
}

/**
 * @param {string} otherUserId
 */
export async function getOrCreateConversation(otherUserId) {
  const supabase = assertSupabase();
  const userId = await currentUserId();
  if (userId === otherUserId) throw new Error("You cannot message yourself.");

  const { data, error } = await supabase.rpc("get_or_create_conversation", {
    p_other_user_id: otherUserId,
  });
  if (error) throw error;
  return data;
}

/**
 * @param {string} conversationId
 * @param {string} body
 */
export async function sendMessage(conversationId, body) {
  const supabase = assertSupabase();
  const userId = await currentUserId();
  const trimmed = String(body || "").trim();
  if (!trimmed) throw new Error("Write a message first.");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: trimmed.slice(0, 4000),
    })
    .select("id,conversation_id,sender_id,body,created_at")
    .single();
  if (error) throw error;
  return normalizeMessage(data);
}

/**
 * @param {string} conversationId
 */
export async function markConversationRead(conversationId) {
  const supabase = assertSupabase();
  const userId = await currentUserId();

  const { error } = await supabase
    .from("conversation_members")
    .update({ unread_count: 0, last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
  if (error && !isMissingTableError(error)) throw error;
}
