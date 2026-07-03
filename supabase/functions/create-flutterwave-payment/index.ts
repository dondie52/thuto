import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  createFlutterwavePaymentLink,
  getFlutterwaveCurrency,
} from "../_shared/flutterwave.ts";
import {
  getFlutterwavePlanAmount,
  getPlanDescription,
  VALID_PREMIUM_PLANS,
} from "../_shared/premiumPlans.ts";
import { getSiteUrl } from "../_shared/siteUrl.ts";
import { getSupabaseAdmin, getSupabaseUserClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401, req);
    }

    const supabaseUser = getSupabaseUserClient(authHeader);
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: "Unauthorized" }, 401, req);
    }
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const planId = String(body?.planId || "").trim();
    if (!VALID_PREMIUM_PLANS.has(planId)) {
      return jsonResponse({ error: "Invalid plan" }, 400, req);
    }

    const amount = getFlutterwavePlanAmount(planId);
    if (!amount) {
      return jsonResponse({ error: "Plan is not configured on the server" }, 503, req);
    }

    const currency = getFlutterwaveCurrency();
    const txRef = `thuto-${crypto.randomUUID()}`;
    const admin = getSupabaseAdmin();

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const { error: insertError } = await admin.from("payment_transactions").insert({
      tx_ref: txRef,
      user_id: user.id,
      plan_id: planId,
      amount,
      currency,
      status: "pending",
      metadata: { email: user.email || null },
    });

    if (insertError) {
      console.error("create-flutterwave-payment insert:", insertError.message);
      return jsonResponse({ error: "Could not start payment" }, 500, req);
    }

    const siteUrl = getSiteUrl();
    const redirectUrl = `${siteUrl}/upgrade/success?provider=flutterwave&tx_ref=${encodeURIComponent(txRef)}`;

    const payment = await createFlutterwavePaymentLink({
      tx_ref: txRef,
      amount,
      currency,
      redirect_url: redirectUrl,
      customer: {
        email: user.email || undefined,
        name: profile?.full_name || undefined,
      },
      customizations: {
        title: "Thuto Pro",
        description: getPlanDescription(planId),
      },
      meta: {
        supabase_user_id: user.id,
        plan_id: planId,
      },
    });

    const link = payment?.data?.link;
    if (!link || typeof link !== "string") {
      return jsonResponse({ error: "Payment link was not returned" }, 502, req);
    }

    return jsonResponse({ url: link, txRef }, 200, req);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment failed";
    console.error("create-flutterwave-payment:", message);
    return jsonResponse({ error: message }, 500, req);
  }
});
