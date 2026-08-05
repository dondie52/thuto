import {
  PREDICTOR_BEST_SIX_STORAGE_KEY,
  PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY,
  PREDICTOR_SYLLABUS_STORAGE_KEY,
} from "./admissions.js";
import { getBookmarkIds, STORAGE_KEY as BOOKMARK_STORAGE_KEY } from "./bookmarks.js";
import { getSupabase } from "./supabase.js";
import { isPremiumActive } from "./premium.js";

/**
 * Pull cloud bookmarks and predictor snapshot into local storage when premium.
 * @param {import('./auth.jsx').Profile | null} profile
 */
export async function syncFromCloud(profile) {
  if (!isPremiumActive(profile)) return;
  const supabase = getSupabase();
  const userId = profile?.id;
  if (!supabase || !userId) return;

  const { data: bookmarks } = await supabase
    .from("user_bookmarks")
    .select("programme_id, sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (bookmarks?.length) {
    const ids = bookmarks.map((row) => row.programme_id).filter(Boolean);
    try {
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }

  const { data: snapshot } = await supabase
    .from("user_predictor_snapshots")
    .select("best_six_total, requirement_grades, syllabus_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (snapshot) {
    try {
      if (snapshot.best_six_total != null) {
        sessionStorage.setItem(PREDICTOR_BEST_SIX_STORAGE_KEY, String(snapshot.best_six_total));
      }
      if (snapshot.syllabus_type) {
        sessionStorage.setItem(PREDICTOR_SYLLABUS_STORAGE_KEY, String(snapshot.syllabus_type));
      }
      if (snapshot.requirement_grades) {
        sessionStorage.setItem(
          PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY,
          JSON.stringify(snapshot.requirement_grades),
        );
      }
    } catch {
      /* ignore */
    }
  }
}

/**
 * Push local bookmarks and predictor snapshot to cloud when premium.
 * @param {import('./auth.jsx').Profile | null} profile
 */
export async function syncToCloud(profile) {
  if (!isPremiumActive(profile)) return;
  const supabase = getSupabase();
  const userId = profile?.id;
  if (!supabase || !userId) return;

  const ids = getBookmarkIds();
  await supabase.from("user_bookmarks").delete().eq("user_id", userId);
  if (ids.length) {
    await supabase.from("user_bookmarks").insert(
      ids.map((programme_id, index) => ({
        user_id: userId,
        programme_id,
        sort_order: index,
      })),
    );
  }

  let bestSix = null;
  let requirementGrades = null;
  let syllabusType = null;
  try {
    const total = sessionStorage.getItem(PREDICTOR_BEST_SIX_STORAGE_KEY);
    if (total != null) bestSix = Number(total);
    const grades = sessionStorage.getItem(PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY);
    if (grades) requirementGrades = JSON.parse(grades);
    syllabusType = sessionStorage.getItem(PREDICTOR_SYLLABUS_STORAGE_KEY);
  } catch {
    /* ignore */
  }

  if (bestSix != null || requirementGrades) {
    await supabase.from("user_predictor_snapshots").upsert({
      user_id: userId,
      best_six_total: bestSix,
      requirement_grades: requirementGrades,
      // Null means the snapshot predates multi-syllabus support and reads as BGCSE.
      syllabus_type: syllabusType || null,
      updated_at: new Date().toISOString(),
    });
  }
}
