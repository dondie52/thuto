import { getSupabase } from "./supabase.js";

/**
 * @typedef {{
 *   id: string,
 *   institution_id: string,
 *   user_id: string,
 *   rating: number,
 *   body: string,
 *   status: string,
 *   reply: string | null,
 *   replied_at: string | null,
 *   created_at: string,
 *   updated_at: string,
 *   author?: { full_name?: string | null, avatar_url?: string | null } | null,
 * }} InstitutionReview
 */

export const REVIEW_MAX_WORDS = 100;
export const REVIEW_STARS = [1, 2, 3, 4, 5];

const SELECT_COLUMNS = "id,institution_id,user_id,rating,body,status,reply,replied_at,created_at,updated_at";

/**
 * @param {string} value
 * @returns {number}
 */
export function countWords(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Trims a review to the word cap without cutting a word in half.
 * @param {string} value
 * @returns {string}
 */
export function clampToWordLimit(value) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= REVIEW_MAX_WORDS) return String(value || "");
  return words.slice(0, REVIEW_MAX_WORDS).join(" ");
}

/**
 * @param {{ rating: number, body: string }} input
 * @returns {string} empty when valid
 */
export function validateReview({ rating, body }) {
  if (!REVIEW_STARS.includes(Number(rating))) return "Choose a rating from 1 to 5 stars.";
  if (countWords(body) > REVIEW_MAX_WORDS) return `Keep your review to ${REVIEW_MAX_WORDS} words or fewer.`;
  return "";
}

/**
 * @param {InstitutionReview[]} reviews
 * @returns {{ count: number, average: number, distribution: Record<number, number> }}
 */
export function summarizeReviews(reviews) {
  const list = Array.isArray(reviews) ? reviews : [];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  for (const review of list) {
    const rating = Number(review?.rating);
    if (!REVIEW_STARS.includes(rating)) continue;
    distribution[rating] += 1;
    total += rating;
  }
  const count = list.length;
  return {
    count,
    average: count ? Math.round((total / count) * 10) / 10 : 0,
    distribution,
  };
}

/**
 * @param {string} institutionId
 * @returns {Promise<InstitutionReview[]>}
 */
export async function fetchInstitutionReviews(institutionId) {
  const supabase = getSupabase();
  if (!supabase || !institutionId) return [];
  const { data, error } = await supabase
    .from("institution_reviews")
    .select(SELECT_COLUMNS)
    .eq("institution_id", institutionId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("Institution reviews fetch failed:", error.message);
    return [];
  }
  return data || [];
}

/**
 * The signed-in student's own review, if they have written one.
 * @param {string} institutionId
 * @returns {Promise<InstitutionReview | null>}
 */
export async function fetchOwnReview(institutionId) {
  const supabase = getSupabase();
  if (!supabase || !institutionId) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("institution_reviews")
    .select(SELECT_COLUMNS)
    .eq("institution_id", institutionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("Own review fetch failed:", error.message);
    return null;
  }
  return data || null;
}

/**
 * Writes the student's review, replacing it if they already had one.
 * @param {{ institutionId: string, rating: number, body: string }} input
 */
export async function saveOwnReview({ institutionId, rating, body }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) throw new Error("Sign in to leave a review.");

  const problem = validateReview({ rating, body });
  if (problem) throw new Error(problem);

  const { error } = await supabase.from("institution_reviews").upsert(
    {
      institution_id: institutionId,
      user_id: userId,
      rating: Number(rating),
      body: clampToWordLimit(body).trim(),
    },
    { onConflict: "institution_id,user_id" },
  );
  if (error) throw new Error(error.message);
}

/**
 * @param {string} reviewId
 */
export async function deleteOwnReview(reviewId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  const { error } = await supabase.from("institution_reviews").delete().eq("id", reviewId);
  if (error) throw new Error(error.message);
}

/**
 * Institution reply. Goes through a definer function so an institution can never edit the
 * rating or the student's words — only attach a reply.
 * @param {string} reviewId
 * @param {string} reply
 */
export async function replyToReview(reviewId, reply) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  const { error } = await supabase.rpc("reply_to_institution_review", {
    p_review_id: reviewId,
    p_reply: reply,
  });
  if (error) throw new Error(error.message);
}
