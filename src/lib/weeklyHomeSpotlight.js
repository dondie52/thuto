/** @param {string} s */
export function hash32(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Monday-start calendar week key in local time (YYYY-MM-DD of that Monday). */
export function localMondayWeekKey(date = new Date()) {
  const x = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = x.getDay();
  const delta = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + delta);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const d = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * @template T
 * @param {T[]} list
 * @param {number} count
 * @param {string} seedStr
 */
export function pickDistinctBySeed(list, count, seedStr) {
  const n = list.length;
  if (n === 0 || count <= 0) return [];
  let state = hash32(seedStr);
  const used = new Set();
  /** @type {T[]} */
  const out = [];
  let guard = 0;
  while (out.length < Math.min(count, n) && guard < n * 8) {
    guard += 1;
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const idx = state % n;
    if (used.has(idx)) continue;
    used.add(idx);
    out.push(list[idx]);
  }
  return out;
}

/** @param {{ id?: string, name?: string, minPoints?: unknown }} programme */
export function programmeEligibleForWeeklySpotlight(programme) {
  return (
    programme &&
    typeof programme.id === "string" &&
    typeof programme.name === "string" &&
    typeof programme.minPoints === "number" &&
    Number.isFinite(programme.minPoints)
  );
}

/** Rotating funding topics (internal links only; confirm on official notices). */
export const WEEKLY_FUNDING_SPOTLIGHTS = [
  {
    title: "Government sponsorship",
    body: "Public sponsorship often runs on its own calendar. Line up documents and deadlines alongside your admission plan.",
    to: "/sponsorships",
    cta: "Funding routes",
  },
  {
    title: "Institution scholarships and bursaries",
    body: "Universities publish merit awards, hardship support, and programme notices in different places than the main prospectus.",
    to: "/universities",
    cta: "University profiles",
  },
  {
    title: "Employer-linked study support",
    body: "Some employers and sectors fund study where the programme matches workforce needs—worth asking early if you have a sponsor in mind.",
    to: "/sponsorships",
    cta: "Plan sponsorship paths",
  },
  {
    title: "Admission vs funding decisions",
    body: "Acceptance and an award are usually separate processes. Track both and confirm wording on official funder notices.",
    to: "/sponsorships",
    cta: "Sponsorship overview",
  },
  {
    title: "Open and distance study costs",
    body: "Part-time and distance programmes can structure fees and payment plans differently—factor that into how you apply for support.",
    to: "/universities/bou",
    cta: "Botswana Open University",
  },
  {
    title: "Science and technology programme funding",
    body: "STEM-heavy programmes sometimes align with industry bursaries; check faculty pages as well as central financial aid.",
    to: "/universities/biust",
    cta: "BIUST profile",
  },
  {
    title: "National university notices",
    body: "Large institutions refresh fees, loans, and award criteria often—bookmark the official student finance hub for your year of entry.",
    to: "/universities/ub",
    cta: "University of Botswana",
  },
  {
    title: "Private college payment options",
    body: "Private institutions may combine instalments, discounts, and external bursaries—ask their admissions office how packages work.",
    to: "/universities",
    cta: "Browse institutions",
  },
];

/** @param {string} weekKey */
export function fundingSpotlightForWeek(weekKey) {
  const i = hash32(`${weekKey}|funding-spotlight`) % WEEKLY_FUNDING_SPOTLIGHTS.length;
  return WEEKLY_FUNDING_SPOTLIGHTS[i];
}
