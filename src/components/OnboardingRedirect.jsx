import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { needsOnboarding } from "../lib/onboarding.js";
import { isInstitutionPartnerUser } from "../lib/partner.js";
import { safeInternalPath } from "../lib/urlSafety.js";

const EXEMPT_PREFIXES = [
  "/auth",
  "/onboarding",
  "/login",
  "/signup",
  "/privacy",
  "/disclaimer",
  "/center",
  "/partner",
];

/**
 * Redirects signed-in users without a username to onboarding.
 * Institution partner users skip student onboarding and are sent to `/partner`
 * when they land on the default student home.
 */
export default function OnboardingRedirect() {
  const { user, profile, isProfileLoading, supabaseConfigured } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const profileNeedsOnboarding = Boolean(profile && needsOnboarding(profile));
  const [institutionChecked, setInstitutionChecked] = useState(false);
  const [isInstitutionUser, setIsInstitutionUser] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured || !user) {
      setInstitutionChecked(true);
      setIsInstitutionUser(false);
      return undefined;
    }
    let cancelled = false;
    setInstitutionChecked(false);
    isInstitutionPartnerUser().then((value) => {
      if (cancelled) return;
      setIsInstitutionUser(value);
      setInstitutionChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [supabaseConfigured, user?.id]);

  useEffect(() => {
    if (!supabaseConfigured || !user || isProfileLoading || !institutionChecked) return;

    const path = location.pathname.replace(/\/$/, "") || "/";

    if (isInstitutionUser) {
      if (path === "/app" || path === "/onboarding") {
        navigate("/partner", { replace: true });
      }
      return;
    }

    if (!profileNeedsOnboarding) return;
    if (EXEMPT_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return;

    const next = safeInternalPath(`${path}${location.search}`) || "/app";
    navigate(`/onboarding?next=${encodeURIComponent(next)}`, { replace: true });
  }, [
    user,
    profileNeedsOnboarding,
    isProfileLoading,
    supabaseConfigured,
    institutionChecked,
    isInstitutionUser,
    location.pathname,
    location.search,
    navigate,
  ]);

  return null;
}
