import { useAuth } from "../lib/auth.jsx";
import { isPremiumActive } from "../lib/premium.js";

export function usePremium() {
  const { profile, isPremium, refreshProfile, isProfileLoading } = useAuth();
  return {
    profile,
    isPremium,
    refreshProfile,
    isProfileLoading,
    isPremiumActive: isPremiumActive(profile),
  };
}
