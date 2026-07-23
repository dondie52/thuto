import { resolveMarketCountry } from "./marketCountry.js";
import { getSupabase, isSupabaseConfigured } from "./supabase.js";

/**
 * @param {string} eventName
 * @param {Record<string, unknown>} [metadata]
 */
export async function trackEvent(eventName, metadata = {}) {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id ?? null;
    const viewerCountry = resolveMarketCountry();
    await supabase.from("analytics_events").insert({
      user_id: userId,
      event_name: eventName,
      metadata: {
        ...metadata,
        viewer_country: metadata.viewer_country || viewerCountry,
      },
    });
  } catch (err) {
    console.warn("Analytics track failed:", err);
  }
}

export function trackProgrammeView(programme) {
  if (!programme?.id) return;
  trackEvent("programme_view", {
    programme_id: programme.id,
    institution_id: programme.universityId || programme.universityShort || null,
    university: programme.university,
    field: programme.field || null,
  });
}

export function trackInstitutionView(university) {
  if (!university?.id) return;
  trackEvent("institution_profile_view", {
    institution_id: university.id,
    source: "profile",
  });
}

/**
 * @param {{
 *   programmeId?: string | null,
 *   institutionId?: string | null,
 *   destinationUrl?: string | null,
 *   linkKind?: 'website' | 'apply' | 'resource' | 'other' | string | null,
 * }} input
 */
export function trackOutboundLinkClick({
  programmeId,
  institutionId,
  destinationUrl,
  linkKind = "other",
}) {
  const kind = linkKind || "other";
  trackEvent("outbound_link_click", {
    programme_id: programmeId || null,
    institution_id: institutionId || null,
    destination_url: destinationUrl || null,
    link_kind: kind,
  });
  if (kind === "apply") {
    trackEvent("apply_click", {
      programme_id: programmeId || null,
      institution_id: institutionId || null,
      destination_url: destinationUrl || null,
      link_kind: kind,
    });
  }
}

/** @deprecated Prefer trackOutboundLinkClick — kept for call-site compatibility */
export function trackApplyClick({ programmeId, institutionId, destinationUrl }) {
  trackOutboundLinkClick({
    programmeId,
    institutionId,
    destinationUrl,
    linkKind: "apply",
  });
}

export function trackUpgradePrompt(feature, action = "shown") {
  trackEvent("upgrade_prompt", { feature, action });
}

export function trackLimitHit(feature) {
  trackEvent("limit_hit", { feature });
}
