import { getSupabase, isSupabaseConfigured } from "./supabase.js";

/**
 * @typedef {{ institution_id: string, role: string, verified_admin_at?: string | null }} InstitutionMembership
 * @typedef {{ institution_id: string, tier: string, verified_at?: string | null, apply_link_config?: Record<string, string> }} InstitutionPartner
 */

/**
 * @returns {Promise<InstitutionMembership[]>}
 */
export async function fetchInstitutionMemberships() {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("institution_users")
    .select("institution_id, role, verified_admin_at");
  if (error) {
    console.warn("Institution memberships fetch failed:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Whether the signed-in user belongs to any institution partner membership.
 * @returns {Promise<boolean>}
 */
export async function isInstitutionPartnerUser() {
  const memberships = await fetchInstitutionMemberships();
  return memberships.length > 0;
}

/**
 * Post-login destination for institution staff vs students.
 * Institution users land on `/partner` unless they explicitly asked for another
 * non-student-home destination (e.g. `/settings`).
 * @param {string | null | undefined} requestedNext
 * @param {{ isInstitutionUser?: boolean }} [options]
 */
export function resolvePostAuthPath(requestedNext, options = {}) {
  const next = typeof requestedNext === "string" ? requestedNext.trim() : "";
  if (options.isInstitutionUser) {
    if (!next || next === "/app" || next === "/onboarding" || next.startsWith("/onboarding?")) {
      return "/partner";
    }
    if (next.startsWith("/partner")) return next;
    // Explicit deep links still honored (settings, upgrade, etc.)
    return next;
  }
  return next || "/app";
}

/**
 * @param {string} institutionId
 * @returns {Promise<InstitutionPartner | null>}
 */
export async function fetchInstitutionPartner(institutionId) {
  const supabase = getSupabase();
  if (!supabase || !institutionId) return null;
  const { data, error } = await supabase
    .from("institution_partners")
    .select("institution_id, tier, verified_at, apply_link_config")
    .eq("institution_id", institutionId)
    .maybeSingle();
  if (error) {
    console.warn("Institution partner fetch failed:", error.message);
    return null;
  }
  return data;
}

/**
 * Verified partners for marketing surfaces (logo wall on /partners).
 * @returns {Promise<Array<{ institutionId: string, tier: string, verifiedAt: string | null }>>}
 */
export async function fetchVerifiedPartnersForMarketing() {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("institution_partners")
    .select("institution_id, tier, verified_at")
    .not("verified_at", "is", null)
    .order("verified_at", { ascending: false });
  if (error) {
    console.warn("Verified partners fetch failed:", error.message);
    return [];
  }
  return (data || []).map((row) => ({
    institutionId: row.institution_id,
    tier: row.tier,
    verifiedAt: row.verified_at,
  }));
}

/**
 * @returns {Promise<Set<string>>}
 */
export async function fetchVerifiedInstitutionIds() {
  const supabase = getSupabase();
  if (!supabase) return new Set();
  const { data, error } = await supabase
    .from("institution_partners")
    .select("institution_id")
    .not("verified_at", "is", null);
  if (error) return new Set();
  return new Set((data || []).map((row) => row.institution_id));
}

/**
 * @param {{ institutionId: string, workEmail: string, notes?: string }} input
 */
export async function submitInstitutionClaim({ institutionId, workEmail, notes = "" }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) throw new Error("Sign in to claim an institution profile.");

  const { error } = await supabase.from("institution_claims").insert({
    institution_id: institutionId,
    user_id: userId,
    work_email: workEmail.trim(),
    notes: notes.trim() || null,
  });
  if (error) throw new Error(error.message);
}

/**
 * @param {string} institutionId
 * @param {number} [days]
 */
export async function fetchInstitutionAnalytics(institutionId, days = 30) {
  const supabase = getSupabase();
  if (!supabase || !institutionId) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceKey = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("institution_analytics_daily")
    .select("event_date, event_name, entity_id, count")
    .eq("institution_id", institutionId)
    .gte("event_date", sinceKey)
    .order("event_date", { ascending: false });

  if (error) {
    console.warn("Institution analytics fetch failed:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Summarise rolled-up institution analytics for the partner dashboard.
 * @param {Array<{ event_name: string, entity_id?: string | null, count?: number }>} rows
 * @param {Array<{ id: string, name?: string, field?: string }>} [programmes]
 */
export function summarizeInstitutionAnalytics(rows, programmes = []) {
  const programmeNameById = new Map(programmes.map((p) => [p.id, p.name || p.id]));
  const totals = {};
  const programmeViews = {};
  const viewerOrigins = {};
  const linkKinds = {};
  const disciplines = {};

  for (const row of rows || []) {
    const name = row.entity_id || "";
    const count = Number(row.count) || 0;
    if (!row.event_name) continue;

    if (row.event_name === "viewer_origin") {
      viewerOrigins[name || "unknown"] = (viewerOrigins[name || "unknown"] || 0) + count;
      continue;
    }
    if (row.event_name === "outbound_link_kind") {
      linkKinds[name || "other"] = (linkKinds[name || "other"] || 0) + count;
      continue;
    }
    if (row.event_name === "discipline_view") {
      disciplines[name || "General"] = (disciplines[name || "General"] || 0) + count;
      continue;
    }

    totals[row.event_name] = (totals[row.event_name] || 0) + count;

    if (row.event_name === "programme_view" && name) {
      programmeViews[name] = (programmeViews[name] || 0) + count;
    }
  }

  const sortEntries = (obj) =>
    Object.entries(obj)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);

  const linkKindTotal = Object.values(linkKinds).reduce((sum, n) => sum + n, 0);

  return {
    totals,
    topProgrammes: sortEntries(programmeViews).map((row) => ({
      ...row,
      label: programmeNameById.get(row.id) || row.id,
    })),
    topCountries: sortEntries(viewerOrigins),
    linkKinds: sortEntries(linkKinds),
    disciplines: sortEntries(disciplines),
    outboundClicks: totals.outbound_link_click || linkKindTotal,
  };
}

/**
 * @param {string} institutionId
 */
export async function fetchInstitutionLeads(institutionId) {
  const supabase = getSupabase();
  if (!supabase || !institutionId) return [];
  const { data, error } = await supabase
    .from("institution_leads")
    .select("id, programme_id, lead_type, payload, status, created_at")
    .eq("institution_id", institutionId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.warn("Institution leads fetch failed:", error.message);
    return [];
  }
  return data || [];
}

/**
 * @param {{ institutionId: string, programmeId?: string, leadType?: string, payload: Record<string, unknown> }} input
 */
export async function submitInstitutionLead({ institutionId, programmeId, leadType = "inquiry", payload }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id ?? null;

  const { error } = await supabase.from("institution_leads").insert({
    institution_id: institutionId,
    programme_id: programmeId || null,
    lead_type: leadType,
    student_user_id: userId,
    payload,
    consent_version: "v1",
  });
  if (error) throw new Error(error.message);
}

/**
 * @param {string} leadId
 * @param {'contacted' | 'archived'} status
 */
export async function updateLeadStatus(leadId, status) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  const { error } = await supabase.from("institution_leads").update({ status }).eq("id", leadId);
  if (error) throw new Error(error.message);
}

/**
 * @returns {Promise<Array<{ id: string, entity_type: string, entity_id: string, placement_key: string }>>}
 */
export async function fetchActiveFeaturedPlacements() {
  const supabase = getSupabase();
  if (!supabase) return [];
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("featured_placements")
    .select("id, entity_type, entity_id, placement_key, institution_id, tier")
    .lte("starts_at", now)
    .gt("ends_at", now);
  if (error) return [];
  return data || [];
}

/**
 * @param {string} institutionId
 * @param {Record<string, unknown>} patch
 * @param {boolean} [published]
 */
export async function saveInstitutionOverride(institutionId, patch, published = true) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) throw new Error("Sign in required.");

  const { data: existing } = await supabase
    .from("content_university_overrides")
    .select("patch")
    .eq("id", institutionId)
    .maybeSingle();

  const previous =
    existing?.patch && typeof existing.patch === "object" && !Array.isArray(existing.patch)
      ? existing.patch
      : {};

  const { error } = await supabase.from("content_university_overrides").upsert(
    {
      id: institutionId,
      institution_id: institutionId,
      patch: { ...previous, ...patch, id: institutionId },
      published,
      updated_by: userId,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);
}

/**
 * @param {string} programmeId
 * @param {string} institutionId
 * @param {Record<string, unknown>} patch
 * @param {boolean} [published]
 */
export async function saveProgrammeOverrideForPartner(programmeId, institutionId, patch, published = true) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured.");
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) throw new Error("Sign in required.");

  const { data: existing } = await supabase
    .from("content_programme_overrides")
    .select("patch")
    .eq("id", programmeId)
    .maybeSingle();

  const previous =
    existing?.patch && typeof existing.patch === "object" && !Array.isArray(existing.patch)
      ? existing.patch
      : {};

  const { error } = await supabase.from("content_programme_overrides").upsert(
    {
      id: programmeId,
      institution_id: institutionId,
      patch: { ...previous, ...patch, id: programmeId },
      published,
      updated_by: userId,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);
}
