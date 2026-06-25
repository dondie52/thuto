/** @typedef {'compare' | 'assistant' | 'cloud_sync' | 'deadline_alerts' | 'documents_checklist' | 'pdf_download' | 'grade_import' | 'acceptance_chance' | 'sponsorship_alerts' | 'message_anyone'} PremiumFeature */

import { FREE_ENTITLEMENTS, PRO_ENTITLEMENTS } from "./entitlements.js";

export { FREE_ENTITLEMENTS, PRO_ENTITLEMENTS, FREE_VS_PRO_FEATURES } from "./entitlements.js";

/** @deprecated Use entitlements.compareMax */
export const COMPARE_MAX_FREE = FREE_ENTITLEMENTS.compareMax;
/** @deprecated Use entitlements.compareMax */
export const COMPARE_MAX_PREMIUM = PRO_ENTITLEMENTS.compareMax;

/** @deprecated Use entitlements.assistantDailyLimit */
export const ASSISTANT_DAILY_LIMIT_FREE = FREE_ENTITLEMENTS.assistantDailyLimit;
/** @deprecated Use entitlements.assistantDailyLimit */
export const ASSISTANT_DAILY_LIMIT_PREMIUM = PRO_ENTITLEMENTS.assistantDailyLimit;

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
  return isPremium ? PRO_ENTITLEMENTS.compareMax : FREE_ENTITLEMENTS.compareMax;
}

/**
 * @param {boolean} isPremium
 */
export function getMaxBookmarks(isPremium) {
  return isPremium ? PRO_ENTITLEMENTS.maxSavedProgrammes : FREE_ENTITLEMENTS.maxSavedProgrammes;
}

/**
 * @param {PremiumFeature} feature
 * @param {{ isPremium?: boolean }} options
 */
export function canUsePremiumFeature(feature, { isPremium = false } = {}) {
  const entitlements = isPremium ? PRO_ENTITLEMENTS : FREE_ENTITLEMENTS;
  switch (feature) {
    case "compare":
      return entitlements.compareMax > FREE_ENTITLEMENTS.compareMax;
    case "assistant":
      return entitlements.assistantDailyLimit > FREE_ENTITLEMENTS.assistantDailyLimit;
    case "cloud_sync":
      return isPremium;
    case "deadline_alerts":
      return entitlements.deadlineAlerts;
    case "documents_checklist":
      return entitlements.documentsChecklist;
    case "pdf_download":
      return entitlements.pdfDownload;
    case "grade_import":
      return entitlements.gradeImport;
    case "acceptance_chance":
      return entitlements.acceptanceChance;
    case "sponsorship_alerts":
      return entitlements.sponsorshipAlerts;
    case "message_anyone":
      return entitlements.messageAnyone;
    default:
      return false;
  }
}

/**
 * @param {boolean} isPremium
 */
export function getAssistantDailyLimit(isPremium) {
  const limit = isPremium ? PRO_ENTITLEMENTS.assistantDailyLimit : FREE_ENTITLEMENTS.assistantDailyLimit;
  return Number.isFinite(limit) ? limit : Number.MAX_SAFE_INTEGER;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {boolean} isPremium
 */
export function getAssistantUsageToday(isPremium) {
  const limit = getAssistantDailyLimit(isPremium);
  if (typeof window === "undefined") return { count: 0, limit };
  try {
    const raw = localStorage.getItem(ASSISTANT_USAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || parsed.date !== todayKey()) {
      return { count: 0, limit };
    }
    return { count: Number(parsed.count) || 0, limit };
  } catch {
    return { count: 0, limit };
  }
}

/**
 * @param {boolean} isPremium
 * @returns {boolean} true if under limit after increment attempt
 */
export function recordAssistantUsage(isPremium) {
  const limit = getAssistantDailyLimit(isPremium);
  if (!Number.isFinite(limit)) return true;
  const { count } = getAssistantUsageToday(isPremium);
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
    id: "yearly",
    name: "Yearly Pro",
    priceLabel: "P59 / year",
    description: "One payment for a full year of Pro. Most popular for application season.",
    badge: "Most Popular",
    highlighted: true,
  },
  {
    id: "five_year",
    name: "5-Year Pro",
    priceLabel: "P199 / 5 years",
    description: "Pay once, stay covered through school and early tertiary years. Save 33%.",
    badge: "Save 33%",
    highlighted: false,
  },
];

/** @param {'yearly' | 'five_year'} planId */
export function getPlanCheckoutLabel(planId) {
  switch (planId) {
    case "yearly":
      return "Get Pro — P59/year";
    case "five_year":
      return "Get Pro — P199/5 years";
    default:
      return "Get Thuto Pro";
  }
}

/** @param {string | null | undefined} planId */
export function formatPlanLabel(planId) {
  switch (planId) {
    case "yearly":
    case "season_pass":
      return "Yearly Pro";
    case "five_year":
      return "5-Year Pro";
    case "monthly":
      return "Monthly (legacy)";
    case "annual":
      return "Annual (legacy)";
    default:
      return planId || "Pro";
  }
}
