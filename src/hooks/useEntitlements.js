import { useAuth } from "../lib/auth.jsx";
import { getEntitlements, getEntitlementsForTier } from "../lib/entitlements.js";

export function useEntitlements() {
  const { profile, isPremium } = useAuth();
  const entitlements = getEntitlements(profile);
  return { entitlements, isPremium, profile };
}

export function useEntitlementsForTier(isPremium) {
  return getEntitlementsForTier(isPremium);
}
