import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getSiteUrl, getStripe } from "../_shared/stripe.ts";
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

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return jsonResponse({ error: "No billing account found. Purchase Thuto Pro first." }, 400, req);
    }

    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getSiteUrl()}/settings`,
    });

    return jsonResponse({ url: portal.url }, 200, req);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portal failed";
    console.error("create-portal-session:", message);
    return jsonResponse({ error: message }, 500, req);
  }
});
