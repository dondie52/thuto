import { getSupabase } from "./supabase.js";

function assertSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Connections are unavailable until Supabase is configured.");
  return supabase;
}

async function currentUserId() {
  const supabase = assertSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error("Sign in to connect with people.");
  return data.user.id;
}

function isMissingTableError(error) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

/**
 * @param {string} recipientId
 */
export async function sendConnectionRequest(recipientId) {
  const supabase = assertSupabase();
  const requesterId = await currentUserId();
  if (requesterId === recipientId) throw new Error("You cannot connect with yourself.");

  const { error } = await supabase.from("connection_requests").upsert(
    {
      requester_id: requesterId,
      recipient_id: recipientId,
      status: "pending",
      responded_at: null,
    },
    { onConflict: "requester_id,recipient_id" },
  );
  if (error) throw error;
}

/**
 * @param {string} requesterId
 * @param {boolean} accept
 */
export async function respondConnectionRequest(requesterId, accept) {
  const supabase = assertSupabase();
  const recipientId = await currentUserId();

  const { error } = await supabase
    .from("connection_requests")
    .update({
      status: accept ? "accepted" : "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("requester_id", requesterId)
    .eq("recipient_id", recipientId)
    .eq("status", "pending");
  if (error) throw error;
}

/**
 * @param {string[]} userIds
 */
export async function fetchPendingOutgoingSet(userIds = []) {
  const supabase = getSupabase();
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!supabase || !ids.length) return new Set();

  const requesterId = await currentUserId().catch(() => null);
  if (!requesterId) return new Set();

  const { data, error } = await supabase
    .from("connection_requests")
    .select("recipient_id")
    .eq("requester_id", requesterId)
    .eq("status", "pending")
    .in("recipient_id", ids);
  if (error) {
    if (isMissingTableError(error)) return new Set();
    return new Set();
  }
  return new Set((data || []).map((row) => row.recipient_id));
}
