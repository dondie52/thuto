import { getSupabase } from "./supabase.js";
import { formatAuthorUniversity } from "./profile.js";

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

/**
 * @param {string[]} userIds
 */
export async function fetchPendingIncomingSet(userIds = []) {
  const supabase = getSupabase();
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!supabase || !ids.length) return new Set();

  const recipientId = await currentUserId().catch(() => null);
  if (!recipientId) return new Set();

  const { data, error } = await supabase
    .from("connection_requests")
    .select("requester_id")
    .eq("recipient_id", recipientId)
    .eq("status", "pending")
    .in("requester_id", ids);
  if (error) {
    if (isMissingTableError(error)) return new Set();
    return new Set();
  }
  return new Set((data || []).map((row) => row.requester_id));
}

/**
 * @param {string[]} userIds
 * @returns {Promise<Map<string, 'none' | 'pending_outgoing' | 'pending_incoming' | 'accepted'>>}
 */
export async function fetchConnectionStatusMap(userIds = []) {
  const supabase = getSupabase();
  const ids = [...new Set(userIds.filter(Boolean))];
  const result = new Map(ids.map((id) => [id, "none"]));
  if (!supabase || !ids.length) return result;

  const userId = await currentUserId().catch(() => null);
  if (!userId) return result;

  const { data, error } = await supabase
    .from("connection_requests")
    .select("requester_id,recipient_id,status")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);
  if (error) {
    if (isMissingTableError(error)) return result;
    return result;
  }

  const idSet = new Set(ids);
  for (const row of data || []) {
    const otherId = row.requester_id === userId ? row.recipient_id : row.requester_id;
    if (!idSet.has(otherId)) continue;
    if (row.status === "accepted") {
      result.set(otherId, "accepted");
    } else if (row.status === "pending") {
      const next = row.requester_id === userId ? "pending_outgoing" : "pending_incoming";
      if (result.get(otherId) !== "accepted") result.set(otherId, next);
    }
  }

  return result;
}

const PROFILE_COLUMNS = "id,full_name,username,bio,avatar_url,university_name,university_status";

function normalizeConnectionPerson(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name?.trim() || "Student",
    username: row.username?.trim() || "",
    avatarUrl: row.avatar_url || "",
    bio: row.bio?.trim() || "",
    universityLine: formatAuthorUniversity({
      universityName: row.university_name,
      universityStatus: row.university_status,
    }),
  };
}

/**
 * @param {{ limit?: number }} [options]
 */
export async function fetchAcceptedConnectionProfiles({ limit = 40 } = {}) {
  const supabase = assertSupabase();
  const userId = await currentUserId();

  const { data: requests, error } = await supabase
    .from("connection_requests")
    .select("requester_id,recipient_id,responded_at")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("responded_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;

  const otherIds = (requests || [])
    .map((row) => (row.requester_id === userId ? row.recipient_id : row.requester_id))
    .filter(Boolean);
  if (!otherIds.length) return [];

  const { data: profiles, error: profileError } = await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", otherIds);
  if (profileError) throw profileError;

  const byId = new Map((profiles || []).map((row) => [row.id, row]));
  return otherIds.map((id) => normalizeConnectionPerson(byId.get(id))).filter(Boolean);
}
