import { getSupabase, isSupabaseConfigured } from "./supabase.js";

async function parseFunctionInvokeError(error, data, fallbackMessage) {
  if (data?.error) return new Error(String(data.error));

  if (error && typeof error === "object") {
    const context = error.context;
    if (context && typeof context.json === "function") {
      try {
        const payload = await context.json();
        if (payload?.error) return new Error(String(payload.error));
      } catch {
        /* fall through */
      }
    }
  }

  const message = String(error?.message || "").trim();
  if (/failed to send a request to the edge function/i.test(message)) {
    return new Error(fallbackMessage);
  }

  return new Error(message || fallbackMessage);
}

/**
 * @param {'yearly' | 'five_year'} planId
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
    throw await parseFunctionInvokeError(
      error,
      data,
      "Could not start checkout. Check that the create-checkout-session Edge Function is deployed and its Stripe secrets are set.",
    );
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
    throw await parseFunctionInvokeError(
      error,
      data,
      "Could not open billing portal. Check that the create-portal-session Edge Function is deployed and the user has a Stripe customer id.",
    );
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
