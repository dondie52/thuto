import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getStripe } from "../_shared/stripe.ts";
import { getSupabaseAdmin, getSupabaseUserClient } from "../_shared/supabaseAdmin.ts";

async function removeUserStorage(admin: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  for (const bucket of ["profile-avatars", "feed-images"] as const) {
    const { data: files, error } = await admin.storage.from(bucket).list(userId, { limit: 100 });
    if (error || !files?.length) continue;

    const paths = files
      .filter((file) => file.name && !file.name.endsWith("/"))
      .map((file) => `${userId}/${file.name}`);

    if (paths.length) {
      await admin.storage.from(bucket).remove(paths);
    }
  }
}

async function cancelStripeBilling(stripeCustomerId: string | null | undefined) {
  if (!stripeCustomerId || !Deno.env.get("STRIPE_SECRET_KEY")) return;

  const stripe = getStripe();
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "active",
    limit: 20,
  });

  for (const subscription of subscriptions.data) {
    await stripe.subscriptions.cancel(subscription.id);
  }
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

    const body = await req.json().catch(() => ({}));
    const password = typeof body?.password === "string" ? body.password : "";
    if (!password) {
      return jsonResponse({ error: "Enter your password to confirm account deletion." }, 400, req);
    }

    const supabaseUser = getSupabaseUserClient(authHeader);
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    const user = userData?.user;
    if (userError || !user?.email) {
      return jsonResponse({ error: "Unauthorized" }, 401, req);
    }

    const { error: verifyError } = await supabaseUser.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (verifyError) {
      return jsonResponse({ error: "Password is incorrect." }, 403, req);
    }

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    try {
      await cancelStripeBilling(profile?.stripe_customer_id);
    } catch (stripeError) {
      const message = stripeError instanceof Error ? stripeError.message : "Billing cleanup failed";
      console.error("delete-account stripe:", message);
      return jsonResponse({ error: "Could not cancel billing before deleting your account. Try again or contact support." }, 502, req);
    }

    await admin.from("feed_posts").update({ reviewed_by: null }).eq("reviewed_by", user.id);
    await admin.from("feed_comments").update({ reviewed_by: null }).eq("reviewed_by", user.id);
    await removeUserStorage(admin, user.id);

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("delete-account auth:", deleteError.message);
      return jsonResponse({ error: "Could not delete your account. Try again or contact support." }, 500, req);
    }

    return jsonResponse({ ok: true }, 200, req);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Account deletion failed";
    console.error("delete-account:", message);
    return jsonResponse({ error: message }, 500, req);
  }
});
