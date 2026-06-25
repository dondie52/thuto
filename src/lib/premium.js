/** @typedef {'compare' | 'assistant' | 'cloud_sync' | 'deadline_alerts' | 'grade_import' | 'acceptance_chance' | 'documents_checklist' | 'pdf_download'} PremiumFeature */

import { ENTITLEMENTS, getEntitlements } from "./entitlements.js";

export const COMPARE_MAX_FREE = ENTITLEMENTS.free.compareMax;
export const COMPARE_MAX_PREMIUM = ENTITLEMENTS.pro.compareMax;

export const ASSISTANT_DAILY_LIMIT_FREE = ENTITLEMENTS.free.assistantDailyLimit;
export const ASSISTANT_DAILY_LIMIT_PREMIUM = ENTITLEMENTS.pro.assistantDailyLimit;

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
 * @param {import('./auth.jsx').Profile | null | undefined} profile
 */
export function getCompareMax(profile) {
  return getEntitlements(profile).compareMax;
}

/** @deprecated Use getCompareMax(profile) */
export function getCompareMaxFromPremium(isPremium) {
  return isPremium ? COMPARE_MAX_PREMIUM : COMPARE_MAX_FREE;
}

/**
 * @param {PremiumFeature} feature
 * @param {{ profile?: import('./auth.jsx').Profile | null, isPremium?: boolean }} options
 */
export function canUsePremiumFeature(feature, { profile = null, isPremium = false } = {}) {
  const ent = profile ? getEntitlements(profile) : isPremium ? ENTITLEMENTS.pro : ENTITLEMENTS.free;
  switch (feature) {
    case "compare":
      return ent.compareMax > ENTITLEMENTS.free.compareMax;
    case "assistant":
      return ent.assistantDailyLimit > ENTITLEMENTS.free.assistantDailyLimit;
    case "cloud_sync":
      return ent.maxSavedProgrammes === Infinity;
    case "deadline_alerts":
      return ent.deadlineAlerts;
    case "grade_import":
      return ent.gradeImport;
    case "acceptance_chance":
      return ent.acceptanceChance;
    case "documents_checklist":
      return ent.documentsChecklist;
    case "pdf_download":
      return ent.pdfDownload;
    default:
      return false;
  }
}

/**
 * @param {import('./auth.jsx').Profile | null | undefined} profile
 */
export function getAssistantDailyLimit(profile) {
  const limit = getEntitlements(profile).assistantDailyLimit;
  return limit === Infinity ? 999999 : limit;
}

/** @deprecated */
export function getAssistantDailyLimitFromPremium(isPremium) {
  return isPremium ? ASSISTANT_DAILY_LIMIT_PREMIUM : ASSISTANT_DAILY_LIMIT_FREE;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {import('./auth.jsx').Profile | null | undefined} profile
 */
export function getAssistantUsageToday(profile) {
  const isPremium = isPremiumActive(profile);
  const limit = getAssistantDailyLimit(profile);
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
 * @param {import('./auth.jsx').Profile | null | undefined} profile
 * @returns {boolean} true if under limit after increment attempt
 */
export function recordAssistantUsage(profile) {
  const limit = getAssistantDailyLimit(profile);
  if (limit >= 999999) return true;
  const { count } = getAssistantUsageToday(profile);
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
    name: "Pro Yearly",
    priceLabel: "P59 one-time",
    description: "One payment for 12 months of Pro — application season and beyond.",
    badge: "Most Popular",
    highlighted: true,
    durationLabel: "1 year access",
  },
  {
    id: "five_year",
    name: "Pro 5-Year",
    priceLabel: "P199 one-time",
    description: "Best long-term value — five years of Pro for less than P40/year.",
    badge: "Save 33%",
    highlighted: false,
    durationLabel: "5 years access",
  },
];

/** @typedef {'yearly' | 'five_year' | 'monthly' | 'annual' | 'season_pass'} PremiumPlanId */

/** @param {PremiumPlanId} planId */
export function getPlanCheckoutLabel(planId) {
  switch (planId) {
    case "yearly":
    case "season_pass":
      return "Upgrade to Pro – P59";
    case "five_year":
    case "annual":
      return "Upgrade to Pro – P199";
    case "monthly":
      return "Subscribe – P29/mo";
    default:
      return "Upgrade to Pro";
  }
}

export const FREE_VS_PRO_FEATURES = [
  { feature: "Careers per programme", free: "1", pro: "Up to 5 + salary estimates" },
  { feature: "Saved programmes", free: "2", pro: "Unlimited" },
  { feature: "Compare programmes", free: "2", pro: "3" },
  { feature: "AI assistant", free: "3/day", pro: "Unlimited" },
  { feature: "Acceptance chance", free: "Hidden", pro: "Shown" },
  { feature: "Grade import (PDF/photo)", free: "No", pro: "Yes" },
  { feature: "Documents checklist", free: "No", pro: "Yes" },
  { feature: "Deadline alerts", free: "In-app dates only", pro: "Push / SMS / WhatsApp" },
  { feature: "Ads", free: "Banner ads", pro: "No ads" },
  { feature: "Support", free: "Community + FAQ", pro: "Email + WhatsApp" },
  { feature: "PDF download & share", free: "No", pro: "Yes" },
  { feature: "Verification badge", free: "No", pro: "On feed profile" },
];
