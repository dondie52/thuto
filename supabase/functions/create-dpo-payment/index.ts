import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createDpoToken, getDpoCheckoutUrl, getDpoCurrency, getDpoServiceType } from "../_shared/dpo.ts";
import { getDpoPlanAmount, getPlanDescription, VALID_PREMIUM_PLANS } from "../_shared/premiumPlans.ts";
import { getSiteUrl } from "../_shared/siteUrl.ts";
import { getSupabaseAdmin, getSupabaseUserClient } from "../_shared/supabaseAdmin.ts";

function splitName(fullName: string | null | undefined) {
  const trimmed = String(fullName || "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || parts[0] || "",
  };
}

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

    const amount = getDpoPlanAmount(planId);
    if (!amount) {
      return jsonResponse({ error: "Plan is not configured on the server" }, 503, req);
    }

    const currency = getDpoCurrency();
    const companyRef = `thuto-${crypto.randomUUID()}`;
    const admin = getSupabaseAdmin();

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const { firstName, lastName } = splitName(profile?.full_name);
    const siteUrl = getSiteUrl();
    const redirectUrl =
      `${siteUrl}/upgrade/success?provider=dpo&company_ref=${encodeURIComponent(companyRef)}`;
    const backUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/dpo-webhook`;

    const { error: insertError } = await admin.from("payment_transactions").insert({
      tx_ref: companyRef,
      user_id: user.id,
      plan_id: planId,
      amount,
      currency,
      status: "pending",
      payment_provider: "dpo",
      metadata: { email: user.email || null },
    });

    if (insertError) {
      console.error("create-dpo-payment insert:", insertError.message);
      return jsonResponse({ error: "Could not start payment" }, 500, req);
    }

    const tokenResponse = await createDpoToken({
      amount,
      currency,
      companyRef,
      redirectUrl,
      backUrl,
      serviceType: getDpoServiceType(),
      serviceDescription: getPlanDescription(planId),
      customerEmail: user.email || undefined,
      customerFirstName: firstName || undefined,
      customerLastName: lastName || undefined,
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId,
      },
    });

    const transToken = tokenResponse.TransToken;
    if (!transToken) {
      return jsonResponse({ error: "DPO did not return a payment token" }, 502, req);
    }

    await admin
      .from("payment_transactions")
      .update({
        dpo_trans_token: transToken,
        provider_transaction_id: tokenResponse.TransRef || null,
      })
      .eq("tx_ref", companyRef);

    return jsonResponse({ url: getDpoCheckoutUrl(transToken), companyRef }, 200, req);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment failed";
    console.error("create-dpo-payment:", message);
    return jsonResponse({ error: message }, 500, req);
  }
});
