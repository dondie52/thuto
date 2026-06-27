import { getSupabase, isSupabaseConfigured } from "./supabase.js";

export { isSupabaseConfigured };

export const PARTNER_INQUIRIES_UNAVAILABLE_MESSAGE =
  "Partner inquiries are unavailable until the latest Supabase table migration is applied and the Data API schema refreshes.";

const PARTNER_TYPES = new Set(["university", "tvet", "employer", "ngo", "school", "other"]);

function isPartnerInquiriesSchemaError(error) {
  const code = String(error?.code || "").trim();
  const message = String(error?.message || "").trim();
  return (
    /partner_inquiries/i.test(message) &&
    (/schema cache/i.test(message) ||
      /relation .*partner_inquiries.* does not exist/i.test(message) ||
      code === "42P01" ||
      code === "PGRST205")
  );
}

function partnerInquiriesUnavailableError(error) {
  return Object.assign(new Error(PARTNER_INQUIRIES_UNAVAILABLE_MESSAGE), {
    cause: error,
    partnerInquiriesUnavailable: true,
  });
}

export function isPartnerInquiriesUnavailableError(error) {
  return (
    Boolean(error?.partnerInquiriesUnavailable) ||
    String(error?.message || "").trim() === PARTNER_INQUIRIES_UNAVAILABLE_MESSAGE
  );
}

/**
 * @param {{ name: string, email: string, organization: string, partnerType?: string, message?: string, userId?: string | null }} input
 */
export async function submitPartnerInquiry({ name, email, organization, partnerType = "other", message = "", userId }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Partner inquiries are not configured.");

  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim();
  const cleanOrganization = String(organization || "").trim();
  const cleanType = PARTNER_TYPES.has(partnerType) ? partnerType : "other";
  const cleanMessage = String(message || "").trim();

  if (cleanName.length < 2) throw new Error("Enter your name.");
  if (cleanEmail.length < 5) throw new Error("Enter a valid email address.");
  if (cleanOrganization.length < 2) throw new Error("Enter your organization name.");

  const payload = {
    name: cleanName,
    email: cleanEmail,
    organization: cleanOrganization,
    partner_type: cleanType,
    message: cleanMessage || null,
    user_id: userId || null,
    status: "new",
  };

  const { error } = await supabase.from("partner_inquiries").insert(payload);
  if (isPartnerInquiriesSchemaError(error)) throw partnerInquiriesUnavailableError(error);
  if (error) throw error;
}

export async function fetchPartnerInquiries({ limit = 40 } = {}) {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("partner_inquiries")
    .select("id, name, email, organization, partner_type, message, user_id, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (isPartnerInquiriesSchemaError(error)) throw partnerInquiriesUnavailableError(error);
  if (error) throw error;
  return data || [];
}

/**
 * @param {string} id
 * @param {'new' | 'reviewing' | 'contacted' | 'archived'} status
 */
export async function updatePartnerInquiryStatus(id, status) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Partner inquiries are not configured.");
  const { error } = await supabase.from("partner_inquiries").update({ status }).eq("id", id);
  if (isPartnerInquiriesSchemaError(error)) throw partnerInquiriesUnavailableError(error);
  if (error) throw error;
}
