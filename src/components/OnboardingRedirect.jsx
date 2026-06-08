import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { needsOnboarding } from "../lib/onboarding.js";
import { safeInternalPath } from "../lib/urlSafety.js";

const EXEMPT_PREFIXES = ["/auth", "/onboarding", "/login", "/signup", "/privacy", "/disclaimer"];

/**
 * Redirects signed-in users without a username to onboarding.
 */
export default function OnboardingRedirect() {
  const { user, profile, isProfileLoading, supabaseConfigured } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabaseConfigured || !user || isProfileLoading) return;
    if (!needsOnboarding(profile)) return;

    const path = location.pathname;
    if (EXEMPT_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return;

    const next = safeInternalPath(`${path}${location.search}`) || "/app";
    navigate(`/onboarding?next=${encodeURIComponent(next)}`, { replace: true });
  }, [user, profile, isProfileLoading, supabaseConfigured, location.pathname, location.search, navigate]);

  return null;
}
