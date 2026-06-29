import { isPremiumActive } from "./premium.js";

/** @typedef {import('./auth.jsx').Profile | null | undefined} Profile */

export const FREE_ENTITLEMENTS = Object.freeze({
  careersPerProgramme: 1,
  showSalaryEstimates: false,
  maxSavedProgrammes: 2,
  deadlineAlerts: false,
  gradeImport: false,
  assistantDailyLimit: 3,
  documentsChecklist: false,
  showAds: true,
  supportTier: "community",
  acceptanceChance: false,
  sponsorshipAlerts: false,
  compareMax: 2,
  pdfDownload: false,
  verificationBadge: false,
  messageAnyone: false,
  centerInstantAccess: false,
  centerUpload: true,
});

export const PRO_ENTITLEMENTS = Object.freeze({
  careersPerProgramme: 5,
  showSalaryEstimates: true,
  maxSavedProgrammes: Number.POSITIVE_INFINITY,
  deadlineAlerts: true,
  gradeImport: true,
  assistantDailyLimit: Number.POSITIVE_INFINITY,
  documentsChecklist: true,
  showAds: false,
  supportTier: "priority",
  acceptanceChance: true,
  sponsorshipAlerts: true,
  compareMax: 3,
  pdfDownload: true,
  verificationBadge: true,
  messageAnyone: true,
  centerInstantAccess: true,
  centerUpload: true,
});

/**
 * @param {Profile} profile
 */
export function getEntitlements(profile) {
  return isPremiumActive(profile) ? PRO_ENTITLEMENTS : FREE_ENTITLEMENTS;
}

/**
 * @param {boolean} isPremium
 */
export function getEntitlementsForTier(isPremium) {
  return isPremium ? PRO_ENTITLEMENTS : FREE_ENTITLEMENTS;
}

/**
 * @param {Profile} profile
 * @param {keyof typeof FREE_ENTITLEMENTS} key
 */
export function canUseEntitlement(profile, key) {
  const value = getEntitlements(profile)[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value > 0 : true;
  return Boolean(value);
}

export const FREE_VS_PRO_FEATURES = [
  { feature: "Careers per programme", free: "1 career, no salary estimates", pro: "Up to 5 careers with salary estimates" },
  { feature: "Saved programmes", free: "Max 2", pro: "Unlimited" },
  { feature: "Deadline & sponsorship alerts", free: "Dates in app only", pro: "WhatsApp, SMS & push notifications" },
  { feature: "Grade input", free: "Manual typing only", pro: "Manual + PDF/photo auto extraction" },
  { feature: "AI chatbot", free: "3 questions per day", pro: "Unlimited" },
  { feature: "Documents checklist", free: "Not included", pro: "Application document checklist" },
  { feature: "Ads", free: "Banner ads", pro: "Ad-free" },
  { feature: "Support", free: "Community & FAQ", pro: "Email (24hr) + WhatsApp team" },
  { feature: "Acceptance chance", free: "Not included", pro: "Grade-based acceptance estimates" },
  { feature: "Compare programmes", free: "Up to 2 side by side", pro: "Up to 3 side by side" },
  { feature: "PDF downloads", free: "Not included", pro: "Download & share programme PDFs" },
  { feature: "Verification badge", free: "Not included", pro: "Verified profile on Thuto feed" },
  { feature: "Messaging", free: "Followers & connections only", pro: "Message anyone" },
  { feature: "Thuto Center downloads", free: "Unlock with upload credits (3 per approval)", pro: "Instant access to all campus materials" },
];
