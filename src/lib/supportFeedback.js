import { getSupabase, isSupabaseConfigured } from "./supabase.js";

export { isSupabaseConfigured };

export async function submitSupportFeedback({ topic, message, contactEmail, userId }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Support feedback is not configured.");
  const cleanTopic = String(topic || "feedback").trim();
  const cleanMessage = String(message || "").trim();
  if (cleanMessage.length < 3) throw new Error("Add a little more detail before sending feedback.");
  const payload = {
    topic: cleanTopic,
    message: cleanMessage,
    contact_email: String(contactEmail || "").trim() || null,
    user_id: userId || null,
    status: "new",
  };
  const { error } = await supabase.from("support_feedback").insert(payload);
  if (error) throw error;
}

export async function fetchSupportFeedback({ limit = 30 } = {}) {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("support_feedback")
    .select("id, topic, message, contact_email, user_id, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function updateSupportFeedbackStatus(id, status) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Support feedback is not configured.");
  const { error } = await supabase.from("support_feedback").update({ status }).eq("id", id);
  if (error) throw error;
}
