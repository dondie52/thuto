import { getSupabase, isSupabaseConfigured } from "./supabase.js";

/**
 * @param {'monthly' | 'annual' | 'season_pass'} planId
 * @returns {Promise<string>} Stripe Checkout URL
 */
export async function startPremiumCheckout(planId) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Accounts are not configured. Set up Supabase to enable Premium checkout.");
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    throw new Error("Sign in before starting checkout.");
  }

  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: { planId },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    throw new Error(error.message || "Could not start checkout.");
  }
  const url = data?.url;
  if (!url || typeof url !== "string") {
    throw new Error(data?.error || "Checkout session did not return a URL.");
  }
  return url;
}

/**
 * @returns {Promise<string>} Stripe Customer Portal URL
 */
export async function openBillingPortal() {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Accounts are not configured.");
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    throw new Error("Sign in to manage billing.");
  }

  const { data, error } = await supabase.functions.invoke("create-portal-session", {
    body: {},
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    throw new Error(error.message || "Could not open billing portal.");
  }
  const url = data?.url;
  if (!url || typeof url !== "string") {
    throw new Error(data?.error || "Billing portal did not return a URL.");
  }
  return url;
}

export function isBillingConfigured() {
  return isSupabaseConfigured();
}
