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
    id: "season_pass",
    name: "Application Season Pass",
    priceLabel: "P59 one-time",
    description: "Apr–Aug application window. One payment, no auto-renew.",
    badge: "Most Popular",
    highlighted: true,
  },
  {
    id: "monthly",
    name: "Monthly",
    priceLabel: "P29 / month",
    description: "Flexible month-to-month access to all Pro tools.",
    badge: null,
    highlighted: false,
  },
  {
    id: "annual",
    name: "Annual",
    priceLabel: "P199 / year",
    description: "Best long-term value — save vs paying monthly.",
    badge: null,
    highlighted: false,
  },
];

/** @param {'monthly' | 'annual' | 'season_pass'} planId */
export function getPlanCheckoutLabel(planId) {
  switch (planId) {
    case "season_pass":
      return "Upgrade to Pro – P59";
    case "monthly":
      return "Subscribe – P29/mo";
    case "annual":
      return "Subscribe – P199/yr";
    default:
      return "Subscribe";
  }
}
