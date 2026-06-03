import { getSupabase, isSupabaseConfigured } from "./supabase.js";

export { isSupabaseConfigured };

export const SUPPORT_FEEDBACK_UNAVAILABLE_MESSAGE =
  "Support feedback is unavailable until the latest Supabase table migration is applied and the Data API schema refreshes.";

function isSupportFeedbackSchemaError(error) {
  const code = String(error?.code || "").trim();
  const message = String(error?.message || "").trim();
  return (
    /support_feedback/i.test(message) &&
    (/schema cache/i.test(message) || /relation .*support_feedback.* does not exist/i.test(message) || code === "42P01" || code === "PGRST205")
  );
}

function supportFeedbackUnavailableError(error) {
  return Object.assign(new Error(SUPPORT_FEEDBACK_UNAVAILABLE_MESSAGE), {
    cause: error,
    supportFeedbackUnavailable: true,
  });
}

export function isSupportFeedbackUnavailableError(error) {
  return Boolean(error?.supportFeedbackUnavailable) || String(error?.message || "").trim() === SUPPORT_FEEDBACK_UNAVAILABLE_MESSAGE;
}

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
  if (isSupportFeedbackSchemaError(error)) throw supportFeedbackUnavailableError(error);
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
  if (isSupportFeedbackSchemaError(error)) throw supportFeedbackUnavailableError(error);
  if (error) throw error;
  return data || [];
}

export async function updateSupportFeedbackStatus(id, status) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Support feedback is not configured.");
  const { error } = await supabase.from("support_feedback").update({ status }).eq("id", id);
  if (isSupportFeedbackSchemaError(error)) throw supportFeedbackUnavailableError(error);
  if (error) throw error;
}
