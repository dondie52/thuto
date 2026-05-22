import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getPriceId, getSiteUrl, getStripe } from "../_shared/stripe.ts";
import { getSupabaseAdmin, getSupabaseUserClient } from "../_shared/supabaseAdmin.ts";

const VALID_PLANS = new Set(["monthly", "annual", "season_pass"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUser = getSupabaseUserClient(authHeader);
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const planId = String(body?.planId || "").trim();
    if (!VALID_PLANS.has(planId)) {
      return jsonResponse({ error: "Invalid plan" }, 400);
    }

    const priceId = getPriceId(planId);
    if (!priceId) {
      return jsonResponse({ error: "Plan is not configured on the server" }, 503);
    }

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const stripe = getStripe();
    let customerId = profile?.stripe_customer_id || null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const siteUrl = getSiteUrl();
    const isSubscription = planId === "monthly" || planId === "annual";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/upgrade/cancel`,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId,
      },
      ...(isSubscription
        ? {
            subscription_data: {
              metadata: { supabase_user_id: user.id, plan_id: planId },
            },
          }
        : {}),
    });

    return jsonResponse({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("create-checkout-session:", message);
    return jsonResponse({ error: message }, 500);
  }
});
