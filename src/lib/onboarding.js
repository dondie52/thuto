import { getSupabase } from "./supabase.js";
import { normalizeProfileRow, updateUserProfile } from "./profile.js";
import { canUsePredictor } from "./syllabus.js";

/**
 * @param {import("./profile.js").Profile | null | undefined} profile
 */
export function isOnboardingComplete(profile) {
  if (!profile) return false;
  if (profile.onboarding_completed_at || profile.onboarding_skipped_at) return true;
  return Boolean(profile.username?.trim());
}

/**
 * @param {import("./profile.js").Profile | null | undefined} profile
 */
export function needsOnboarding(profile) {
  if (!profile) return false;
  return !isOnboardingComplete(profile);
}

/**
 * @param {import("./profile.js").Profile | null | undefined} profile
 */
export function hasPredictorAccess(profile) {
  return canUsePredictor(profile?.syllabus_type);
}

function assertSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Onboarding is unavailable until Supabase is configured.");
  return supabase;
}

async function currentUserId() {
  const supabase = assertSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Sign in to continue onboarding.");
  return user.id;
}

/**
 * @param {string[]} universityIds
 */
export async function saveTargetInstitutions(universityIds) {
  const supabase = assertSupabase();
  const userId = await currentUserId();
  const ids = [...new Set((universityIds || []).map((id) => String(id).trim()).filter(Boolean))].slice(0, 10);

  const { error: deleteError } = await supabase.from("user_target_institutions").delete().eq("user_id", userId);
  if (deleteError) throw deleteError;

  if (!ids.length) return ids;

  const rows = ids.map((universityId, index) => ({
    user_id: userId,
    university_id: universityId,
    sort_order: index,
  }));

  const { error: insertError } = await supabase.from("user_target_institutions").insert(rows);
  if (insertError) throw insertError;
  return ids;
}

/**
 * @returns {Promise<string[]>}
 */
export async function fetchTargetInstitutions() {
  const supabase = assertSupabase();
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("user_target_institutions")
    .select("university_id, sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => row.university_id);
}

/**
 * @param {Array<{ subjectId: string, grade: string, grade2?: string }>} entries
 */
export async function saveGradeEntries(entries) {
  const supabase = assertSupabase();
  const userId = await currentUserId();
  const cleaned = (entries || [])
    .filter((entry) => entry.subjectId && entry.grade?.trim())
    .map((entry, index) => ({
      user_id: userId,
      subject_id: entry.subjectId,
      grade: String(entry.grade).trim().toUpperCase(),
      grade2: entry.grade2?.trim() ? String(entry.grade2).trim().toUpperCase() : null,
      sort_order: index,
    }));

  const { error: deleteError } = await supabase.from("user_grade_entries").delete().eq("user_id", userId);
  if (deleteError) throw deleteError;

  if (!cleaned.length) return cleaned;

  const { error: insertError } = await supabase.from("user_grade_entries").insert(cleaned);
  if (insertError) throw insertError;
  return cleaned;
}

/**
 * @returns {Promise<Array<{ subjectId: string, grade: string, grade2?: string }>>}
 */
export async function fetchGradeEntries() {
  const supabase = assertSupabase();
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("user_grade_entries")
    .select("subject_id, grade, grade2, sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => ({
    subjectId: row.subject_id,
    grade: row.grade,
    grade2: row.grade2 || "",
  }));
}

/**
 * @param {'complete' | 'skip'} mode
 */
export async function finishOnboarding(mode) {
  const supabase = assertSupabase();
  const userId = await currentUserId();
  const now = new Date().toISOString();
  const patch =
    mode === "complete"
      ? { onboarding_completed_at: now, onboarding_skipped_at: null }
      : { onboarding_skipped_at: now };

  const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select("*").single();
  if (error) throw error;
  return normalizeProfileRow(data);
}

export { updateUserProfile };
