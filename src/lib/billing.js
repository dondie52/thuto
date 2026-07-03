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

async function getAccessToken() {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Accounts are not configured. Set up Supabase to enable Premium checkout.");
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    throw new Error("Sign in before starting checkout.");
  }
  return { supabase, token };
}

/**
 * @param {import('./auth.jsx').Profile | null | undefined} profile
 */
export function canManageStripeBilling(profile) {
  return profile?.payment_provider === "stripe" && Boolean(profile?.stripe_customer_id);
}

/**
 * @param {'yearly' | 'five_year'} planId
 * @returns {Promise<string>} DPO hosted checkout URL
 */
export async function startPremiumCheckout(planId) {
  const { supabase, token } = await getAccessToken();

  const { data, error } = await supabase.functions.invoke("create-dpo-payment", {
    body: { planId },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    throw await parseFunctionInvokeError(
      error,
      data,
      "Could not start checkout. Check that the create-dpo-payment Edge Function is deployed and DPO secrets are set.",
    );
  }
  const url = data?.url;
  if (!url || typeof url !== "string") {
    throw new Error(data?.error || "Checkout did not return a payment URL.");
  }
  return url;
}

/**
 * @param {{ companyRef: string, transToken: string }} params
 * @returns {Promise<{ ok: boolean, alreadyCompleted?: boolean }>}
 */
export async function verifyDpoPayment({ companyRef, transToken }) {
  const { supabase, token } = await getAccessToken();

  const { data, error } = await supabase.functions.invoke("verify-dpo-payment", {
    body: {
      companyRef,
      transToken,
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    throw await parseFunctionInvokeError(
      error,
      data,
      "Could not verify payment. Pro may still activate shortly via DPO callback.",
    );
  }
  if (!data?.ok) {
    throw new Error(data?.error || "Payment verification failed.");
  }
  return data;
}

/**
 * @returns {Promise<string>} Stripe Customer Portal URL
 */
export async function openBillingPortal() {
  const { supabase, token } = await getAccessToken();

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
