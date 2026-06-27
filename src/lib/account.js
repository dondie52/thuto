import { PREDICTOR_BEST_SIX_STORAGE_KEY, PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY } from "./admissions.js";
import { STORAGE_KEY as BOOKMARK_STORAGE_KEY } from "./bookmarks.js";
import { COMPARE_SELECTION_STORAGE_KEY } from "./compareSelection.js";
import { FIT_FINDER_ANSWERS_KEY } from "./fitFinder.js";
import { getSupabase, isSupabaseConfigured } from "./supabase.js";

async function parseFunctionInvokeError(error, data, fallbackMessage) {
  if (data?.error) return new Error(String(data.error));

  if (error && typeof error === "object") {
    const context = error.context;
    if (context && typeof context.json === "function") {
      try {
        const payload = await context.json();
        if (payload?.error) return new Error(String(payload.error));
      } catch {
        /* fall through */
      }
    }
  }

  const message = String(error?.message || "").trim();
  if (/failed to send a request to the edge function/i.test(message)) {
    return new Error(fallbackMessage);
  }

  return new Error(message || fallbackMessage);
}

export function clearLocalAccountData() {
  try {
    localStorage.removeItem(BOOKMARK_STORAGE_KEY);
    localStorage.removeItem(FIT_FINDER_ANSWERS_KEY);
    localStorage.removeItem("thuto:notification-preferences");
    localStorage.removeItem("thuto-saved-feed-posts");
    localStorage.removeItem("thuto.assistantDailyUsage");
    sessionStorage.removeItem(PREDICTOR_BEST_SIX_STORAGE_KEY);
    sessionStorage.removeItem(PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY);
    sessionStorage.removeItem(COMPARE_SELECTION_STORAGE_KEY);
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Permanently delete the signed-in account and associated cloud data.
 * @param {{ password: string }} params
 */
export async function deleteAccount({ password }) {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error("Account deletion is unavailable until Supabase is configured.");
  }

  const trimmedPassword = String(password || "").trim();
  if (!trimmedPassword) {
    throw new Error("Enter your password to confirm account deletion.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    throw new Error("Sign in to delete your account.");
  }

  const { data, error } = await supabase.functions.invoke("delete-account", {
    body: { password: trimmedPassword },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    throw await parseFunctionInvokeError(
      error,
      data,
      "Could not delete your account. Check that the delete-account Edge Function is deployed.",
    );
  }

  if (!data?.ok) {
    throw new Error(data?.error || "Account deletion failed.");
  }

  clearLocalAccountData();
  await supabase.auth.signOut({ scope: "local" });
  return true;
}
