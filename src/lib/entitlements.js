import { isPremiumActive } from "./premium.js";

/** @typedef {import('./auth.jsx').Profile | null | undefined} Profile */

export const ENTITLEMENTS = {
  free: {
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
  },
  pro: {
    careersPerProgramme: 5,
    showSalaryEstimates: true,
    maxSavedProgrammes: Infinity,
    deadlineAlerts: true,
    gradeImport: true,
    assistantDailyLimit: Infinity,
    documentsChecklist: true,
    showAds: false,
    supportTier: "priority",
    acceptanceChance: true,
    sponsorshipAlerts: true,
    compareMax: 3,
    pdfDownload: true,
    verificationBadge: true,
    messageAnyone: true,
  },
};

/**
 * @param {Profile} profile
 */
export function getEntitlements(profile) {
  return isPremiumActive(profile) ? ENTITLEMENTS.pro : ENTITLEMENTS.free;
}

/**
 * @param {Profile} profile
 * @param {keyof typeof ENTITLEMENTS.free} key
 */
export function hasEntitlement(profile, key) {
  const ent = getEntitlements(profile);
  return Boolean(ent[key]);
}
