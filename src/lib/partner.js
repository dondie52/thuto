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
    .select("id, entity_type, entity_id, placement_key, institution_id")
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

  const { error } = await supabase.from("content_university_overrides").upsert(
    {
      id: institutionId,
      institution_id: institutionId,
      patch: { ...patch, id: institutionId },
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

  const { error } = await supabase.from("content_programme_overrides").upsert(
    {
      id: programmeId,
      institution_id: institutionId,
      patch: { ...patch, id: programmeId },
      published,
      updated_by: userId,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);
}
