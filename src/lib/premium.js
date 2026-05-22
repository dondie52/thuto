/** @typedef {'compare' | 'assistant' | 'cloud_sync' | 'deadline_alerts'} PremiumFeature */

export const COMPARE_MAX_FREE = 3;
export const COMPARE_MAX_PREMIUM = 5;

export const ASSISTANT_DAILY_LIMIT_FREE = 5;
export const ASSISTANT_DAILY_LIMIT_PREMIUM = 40;

const ASSISTANT_USAGE_KEY = "thuto.assistantDailyUsage";

/**
 * @param {import('./auth.jsx').Profile | null | undefined} profile
 */
export function isPremiumActive(profile) {
  if (!profile) return false;
  if (profile.premium_status !== "active") return false;
  if (!profile.premium_until) return true;
  return new Date(profile.premium_until).getTime() > Date.now();
}

/**
 * @param {boolean} isPremium
 */
export function getCompareMax(isPremium) {
  return isPremium ? COMPARE_MAX_PREMIUM : COMPARE_MAX_FREE;
}

/**
 * @param {PremiumFeature} feature
 * @param {{ isPremium?: boolean }} options
 */
export function canUsePremiumFeature(feature, { isPremium = false } = {}) {
  switch (feature) {
    case "compare":
      return isPremium;
    case "assistant":
      return isPremium;
    case "cloud_sync":
      return isPremium;
    case "deadline_alerts":
      return isPremium;
    default:
      return false;
  }
}

/**
 * @param {boolean} isPremium
 */
export function getAssistantDailyLimit(isPremium) {
  return isPremium ? ASSISTANT_DAILY_LIMIT_PREMIUM : ASSISTANT_DAILY_LIMIT_FREE;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {boolean} isPremium
 */
export function getAssistantUsageToday(isPremium) {
  if (typeof window === "undefined") return { count: 0, limit: getAssistantDailyLimit(isPremium) };
  try {
    const raw = localStorage.getItem(ASSISTANT_USAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const limit = getAssistantDailyLimit(isPremium);
    if (!parsed || parsed.date !== todayKey()) {
      return { count: 0, limit };
    }
    return { count: Number(parsed.count) || 0, limit };
  } catch {
    return { count: 0, limit: getAssistantDailyLimit(isPremium) };
  }
}

/**
 * @param {boolean} isPremium
 * @returns {boolean} true if under limit after increment attempt
 */
export function recordAssistantUsage(isPremium) {
  const { count, limit } = getAssistantUsageToday(isPremium);
  if (count >= limit) return false;
  try {
    localStorage.setItem(
      ASSISTANT_USAGE_KEY,
      JSON.stringify({ date: todayKey(), count: count + 1 }),
    );
  } catch {
    /* ignore */
  }
  return true;
}

/**
 * @param {import('./auth.jsx').Profile | null | undefined} profile
 */
export function formatPremiumUntil(profile) {
  if (!profile?.premium_until) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(new Date(profile.premium_until));
  } catch {
    return profile.premium_until;
  }
}

export const PREMIUM_PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    priceLabel: "P35 / month",
    description: "Ongoing alerts, cloud shortlist sync, and richer guidance.",
    badge: null,
  },
  {
    id: "annual",
    name: "Annual",
    priceLabel: "P350 / year",
    description: "Best value — about two months free vs monthly.",
    badge: "Popular",
  },
  {
    id: "season_pass",
    name: "Application season",
    priceLabel: "P99 one-time",
    description: "Aug–Mar pass with no auto-renew. Full premium for one cycle.",
    badge: "Season",
  },
];
