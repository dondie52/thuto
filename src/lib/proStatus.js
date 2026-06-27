import { getSupabase } from "./supabase.js";
import { isPremiumActive } from "./premium.js";

export const PROFILE_PRO_FIELDS = "premium_status,premium_until";

/**
 * @param {{ premium_status?: string | null, premium_until?: string | null } | null | undefined} profile
 */
export function profileRowIsPro(profile) {
  return isPremiumActive(profile);
}

/**
 * @param {string[]} userIds
 * @returns {Promise<Map<string, boolean>>}
 */
export async function fetchProStatusMap(userIds = []) {
  const ids = [...new Set(userIds.filter(Boolean))];
  const map = new Map();
  if (!ids.length) return map;

  const supabase = getSupabase();
  if (!supabase) return map;

  const { data, error } = await supabase.from("profiles").select(`id,${PROFILE_PRO_FIELDS}`).in("id", ids);
  if (error) {
    console.warn("Could not load Pro status:", error.message);
    return map;
  }

  for (const row of data || []) {
    map.set(row.id, profileRowIsPro(row));
  }
  return map;
}

/**
 * @template {{ author_id?: string, author_is_pro?: boolean }} T
 * @param {T[]} rows
 * @param {Map<string, boolean>} proByUserId
 * @returns {T[]}
 */
export function applyAuthorProFlags(rows, proByUserId) {
  return (rows || []).map((row) => ({
    ...row,
    author_is_pro:
      typeof row.author_is_pro === "boolean" ? row.author_is_pro : Boolean(proByUserId.get(row.author_id)),
  }));
}
