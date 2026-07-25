/** @typedef {"accommodation" | "laptop" | "discount" | "bursary" | "other"} StudentIncentiveCategory */

/** @typedef {{ category: StudentIncentiveCategory, label: string, detail?: string, sourceUrl?: string, sourceLabel?: string }} StudentIncentive */

/** @type {Record<StudentIncentiveCategory, { label: string }>} */
export const STUDENT_INCENTIVE_CATEGORY_META = {
  accommodation: { label: "Accommodation" },
  laptop: { label: "Devices" },
  discount: { label: "Discounts & payment" },
  bursary: { label: "Bursaries & aid" },
  other: { label: "Other offers" },
};

/**
 * @param {unknown} value
 * @returns {StudentIncentive[]}
 */
export function normalizeStudentIncentives(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = String(item.label || "").trim();
      if (!label) return null;
      const category = String(item.category || "other").trim().toLowerCase();
      const validCategory =
        category in STUDENT_INCENTIVE_CATEGORY_META ? /** @type {StudentIncentiveCategory} */ (category) : "other";
      const detail = String(item.detail || "").trim();
      const sourceUrl = String(item.sourceUrl || "").trim();
      const sourceLabel = String(item.sourceLabel || "").trim();
      return {
        category: validCategory,
        label,
        ...(detail ? { detail } : {}),
        ...(sourceUrl ? { sourceUrl } : {}),
        ...(sourceLabel ? { sourceLabel } : {}),
      };
    })
    .filter(Boolean);
}
