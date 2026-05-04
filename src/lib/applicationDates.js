/**
 * Date-only helpers using UTC noon to avoid DST edge cases.
 * @param {string | undefined | null} iso YYYY-MM-DD
 * @returns {Date | null}
 */
export function parseIsoDate(iso) {
  if (iso == null || typeof iso !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const t = Date.UTC(y, mo, d, 12, 0, 0);
  const dt = new Date(t);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** @returns {number | null} whole days from today (UTC) to target; negative if past */
export function daysFromTodayTo(iso) {
  const end = parseIsoDate(iso);
  if (!end) return null;
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0);
  const diffMs = end.getTime() - todayUtc;
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * @param {string | undefined | null} closeIso
 * @param {number} n
 */
export function isDeadlineWithinDays(closeIso, n) {
  const d = daysFromTodayTo(closeIso);
  if (d == null) return false;
  return d >= 0 && d <= n;
}

/**
 * @param {string | undefined | null} closeIso
 * @returns {string | null} human-readable countdown
 */
export function formatCountdown(closeIso) {
  const d = daysFromTodayTo(closeIso);
  if (d == null) return null;
  if (d < 0) return "Applications closed";
  if (d === 0) return "Closes today";
  if (d === 1) return "1 day left to apply";
  return `${d} days left to apply`;
}

/**
 * Among universities with a valid future (or today) close date, pick the soonest.
 * @param {Array<{ applicationClose?: string, id?: string, name?: string }>} universities
 * @param {{ maxDaysAhead?: number }} [opts] if set, only consider closes within this many days from today
 * @returns {{ university: object, daysLeft: number } | null}
 */
export function findSoonestClosing(universities, opts = {}) {
  const { maxDaysAhead } = opts;
  let best = null;
  for (const u of universities) {
    const close = u.applicationClose;
    if (!close) continue;
    const daysLeft = daysFromTodayTo(close);
    if (daysLeft == null || daysLeft < 0) continue;
    if (maxDaysAhead != null && daysLeft > maxDaysAhead) continue;
    if (!best || daysLeft < best.daysLeft) {
      best = { university: u, daysLeft };
    }
  }
  return best;
}

/**
 * @param {string | undefined | null} iso
 * @returns {string}
 */
export function formatDisplayDate(iso) {
  const d = parseIsoDate(iso);
  if (!d) return iso ?? "";
  return new Intl.DateTimeFormat("en-BW", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export const APPLICATION_DATES_DISCLAIMER =
  "Verify with the university - application dates may change.";
