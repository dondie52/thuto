import { getSupabase, isSupabaseConfigured } from "./supabase.js";

export { isSupabaseConfigured };

/** @typedef {'private_sponsorship' | 'internship' | 'postgraduate_scholarship'} OpportunityCategory */

/** @typedef {{
 *   id: string,
 *   category: OpportunityCategory,
 *   sponsor: string,
 *   title: string,
 *   body: string,
 *   imageUrl: string,
 *   sourceUrl: string,
 *   publishedAt: string | null,
 *   expiresAt: string | null,
 * }} OpportunityPost */

export const OPPORTUNITY_CATEGORY = {
  PRIVATE_SPONSORSHIP: "private_sponsorship",
  INTERNSHIP: "internship",
  POSTGRADUATE_SCHOLARSHIP: "postgraduate_scholarship",
};

/**
 * @param {unknown} row
 * @returns {OpportunityPost | null}
 */
function normalizeRow(row) {
  if (!row || typeof row !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (row);
  if (typeof r.id !== "string" || typeof r.title !== "string" || typeof r.body !== "string") {
    return null;
  }
  const category =
    r.category === OPPORTUNITY_CATEGORY.INTERNSHIP
      ? OPPORTUNITY_CATEGORY.INTERNSHIP
      : r.category === OPPORTUNITY_CATEGORY.POSTGRADUATE_SCHOLARSHIP
        ? OPPORTUNITY_CATEGORY.POSTGRADUATE_SCHOLARSHIP
        : OPPORTUNITY_CATEGORY.PRIVATE_SPONSORSHIP;

  return {
    id: r.id,
    category,
    sponsor: typeof r.sponsor === "string" ? r.sponsor.trim() : "",
    title: r.title.trim(),
    body: r.body.trim(),
    imageUrl: typeof r.image_url === "string" ? r.image_url.trim() : "",
    sourceUrl: typeof r.source_url === "string" ? r.source_url.trim() : "",
    publishedAt: typeof r.published_at === "string" ? r.published_at : null,
    expiresAt: typeof r.expires_at === "string" ? r.expires_at : null,
  };
}

/**
 * @param {OpportunityCategory} category
 * @returns {Promise<OpportunityPost[]>}
 */
export async function fetchOpportunityPosts(category) {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("opportunity_posts")
    .select("id, category, sponsor, title, body, image_url, source_url, published_at, expires_at")
    .eq("category", category)
    .order("sort_order", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeRow).filter(Boolean);
}

/**
 * @param {string | null | undefined} iso
 * @returns {string}
 */
export function formatOpportunityDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
