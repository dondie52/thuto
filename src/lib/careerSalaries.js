/** Indicative monthly salary bands (BWP) by career keyword — Pro-only display. */
const SALARY_BANDS = [
  { keywords: ["engineer", "engineering", "developer", "software", "it ", "technology"], min: 12000, max: 28000 },
  { keywords: ["nurse", "nursing", "health", "medical", "doctor", "clinical"], min: 8000, max: 22000 },
  { keywords: ["account", "finance", "bank", "audit", "economist"], min: 9000, max: 20000 },
  { keywords: ["teacher", "education", "lecturer"], min: 7000, max: 15000 },
  { keywords: ["law", "legal", "attorney", "advocate"], min: 10000, max: 25000 },
  { keywords: ["manager", "management", "administrator", "executive"], min: 10000, max: 30000 },
  { keywords: ["marketing", "sales", "communication", "media"], min: 7000, max: 18000 },
  { keywords: ["agriculture", "farm", "environment"], min: 6000, max: 14000 },
];

const DEFAULT_BAND = { min: 6000, max: 15000 };

/**
 * @param {string} career
 * @returns {{ min: number, max: number, label: string } | null}
 */
export function getCareerSalaryEstimate(career) {
  const text = String(career || "").toLowerCase();
  if (!text.trim()) return null;

  for (const band of SALARY_BANDS) {
    if (band.keywords.some((kw) => text.includes(kw))) {
      return {
        min: band.min,
        max: band.max,
        label: `P${band.min.toLocaleString()}–P${band.max.toLocaleString()}/month (indicative)`,
      };
    }
  }

  return {
    min: DEFAULT_BAND.min,
    max: DEFAULT_BAND.max,
    label: `P${DEFAULT_BAND.min.toLocaleString()}–P${DEFAULT_BAND.max.toLocaleString()}/month (indicative)`,
  };
}
