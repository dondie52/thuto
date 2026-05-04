import { getSupabase, isSupabaseConfigured } from "./supabase.js";

export { isSupabaseConfigured };

const RATE_STORAGE_KEY = "thuto_community_submissions_day";
const MAX_SUBMISSIONS_PER_DAY = 3;

/** @typedef {'accepted' | 'waitlisted' | 'rejected'} Outcome */

/**
 * @returns {{ day: string, count: number }}
 */
function readDayBucket() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(RATE_STORAGE_KEY);
    if (!raw) return { day: today, count: 0 };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.day === today && typeof parsed.count === "number") {
      return { day: parsed.day, count: Math.max(0, parsed.count) };
    }
    return { day: today, count: 0 };
  } catch {
    return { day: today, count: 0 };
  }
}

/**
 * @returns {{ allowed: boolean, remainingToday: number, message?: string }}
 */
export function getSubmissionRateLimitState() {
  if (typeof localStorage === "undefined") {
    return { allowed: true, remainingToday: MAX_SUBMISSIONS_PER_DAY };
  }
  const { day, count } = readDayBucket();
  const remaining = Math.max(0, MAX_SUBMISSIONS_PER_DAY - count);
  if (count >= MAX_SUBMISSIONS_PER_DAY) {
    return {
      allowed: false,
      remainingToday: 0,
      message: `You can submit up to ${MAX_SUBMISSIONS_PER_DAY} times per day from this device. Try again tomorrow.`,
    };
  }
  return { allowed: true, remainingToday: remaining };
}

export function recordSubmissionForRateLimit() {
  if (typeof localStorage === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  const { day, count } = readDayBucket();
  const next = day === today ? count + 1 : 1;
  localStorage.setItem(RATE_STORAGE_KEY, JSON.stringify({ day: today, count: next }));
}

function emptyAggregate() {
  const z = { count: 0, pct: 0, avg: null };
  return {
    totalCount: 0,
    latestYear: null,
    accepted: { ...z },
    waitlisted: { ...z },
    rejected: { ...z },
  };
}

/**
 * @param {Array<{ points: number, outcome: string, year: number }>} rows
 * @returns {{
 *   totalCount: number,
 *   latestYear: number | null,
 *   accepted: { count: number, pct: number, avg: number | null },
 *   waitlisted: { count: number, pct: number, avg: number | null },
 *   rejected: { count: number, pct: number, avg: number | null },
 * } | null}
 */
export function aggregateSubmissions(rows) {
  if (!Array.isArray(rows)) return null;
  if (rows.length === 0) return emptyAggregate();

  const totalCount = rows.length;
  /** @type {Record<string, number[]>} */
  const pointsBy = { accepted: [], waitlisted: [], rejected: [] };
  let maxYear = null;

  for (const r of rows) {
    const o = r.outcome;
    if (o in pointsBy && typeof r.points === "number" && Number.isFinite(r.points)) {
      pointsBy[o].push(r.points);
    }
    if (typeof r.year === "number" && Number.isFinite(r.year)) {
      maxYear = maxYear == null ? r.year : Math.max(maxYear, r.year);
    }
  }

  /**
   * @param {number[]} pts
   */
  function avgOf(pts) {
    if (!pts.length) return null;
    const sum = pts.reduce((a, b) => a + b, 0);
    return sum / pts.length;
  }

  /**
   * @param {string} key
   */
  function bucket(key) {
    const pts = pointsBy[key] || [];
    const count = pts.length;
    const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    return { count, pct, avg: avgOf(pts) };
  }

  return {
    totalCount,
    latestYear: maxYear,
    accepted: bucket("accepted"),
    waitlisted: bucket("waitlisted"),
    rejected: bucket("rejected"),
  };
}

/**
 * @param {string} programmeId
 * @returns {Promise<{ points: number, outcome: string, year: number }[]>}
 */
export async function fetchSubmissionsForProgramme(programmeId) {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("submissions")
    .select("points, outcome, year")
    .eq("programme_id", programmeId)
    .order("year", { ascending: false });

  if (error) throw error;
  const list = Array.isArray(data) ? data : [];
  return list.map((r) => ({
    points: Number(r.points),
    outcome: String(r.outcome),
    year: Number(r.year),
  }));
}

/**
 * @param {{
 *   programmeId: string,
 *   programmeName: string,
 *   university: string,
 *   points: number,
 *   outcome: Outcome,
 *   year: number,
 * }} payload
 */
export async function insertSubmission(payload) {
  const sb = getSupabase();
  if (!sb) throw new Error("Community submissions are not configured.");

  const limit = getSubmissionRateLimitState();
  if (!limit.allowed) {
    throw new Error(limit.message || "Submission limit reached.");
  }

  const { error } = await sb.from("submissions").insert([
    {
      programme_id: payload.programmeId,
      programme_name: payload.programmeName,
      university: payload.university,
      points: payload.points,
      outcome: payload.outcome,
      year: payload.year,
    },
  ]);

  if (error) throw error;
  recordSubmissionForRateLimit();
}
