import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { isDpoPaidResult, verifyDpoToken } from "../_shared/dpo.ts";
import { fulfillDpoPayment } from "../_shared/premiumActivation.ts";
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
    const companyRef = String(body?.companyRef || body?.company_ref || "").trim();
    const transToken = String(body?.transToken || body?.transactionToken || body?.TransactionToken || "").trim();

    if (!companyRef || !transToken) {
      return jsonResponse({ error: "Missing payment reference" }, 400, req);
    }

    const admin = getSupabaseAdmin();
    const { data: txn } = await admin
      .from("payment_transactions")
      .select("user_id, status")
      .eq("tx_ref", companyRef)
      .maybeSingle();

    if (!txn) {
      return jsonResponse({ error: "Unknown payment reference" }, 404, req);
    }
    if (txn.user_id !== user.id) {
      return jsonResponse({ error: "Forbidden" }, 403, req);
    }
    if (txn.status === "completed") {
      return jsonResponse({ ok: true, alreadyCompleted: true }, 200, req);
    }

    const verified = await verifyDpoToken(transToken, companyRef);
    if (!isDpoPaidResult(verified.Result)) {
      return jsonResponse({
        error: verified.ResultExplanation || "Payment not completed",
        result: verified.Result || null,
      }, 400, req);
    }

    const result = await fulfillDpoPayment(
      companyRef,
      {
        amount: Number(verified.TransactionAmount || verified.PaymentAmount || 0),
        currency: String(verified.TransactionCurrency || verified.PaymentCurrency || ""),
        paid: true,
      },
      {
        transToken,
        transRef: verified.TransRef || undefined,
      },
    );

    if (!result.ok && !result.alreadyCompleted) {
      return jsonResponse({ error: result.error || "Could not activate Pro" }, 400, req);
    }

    return jsonResponse({ ok: true, alreadyCompleted: Boolean(result.alreadyCompleted) }, 200, req);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    console.error("verify-dpo-payment:", message);
    return jsonResponse({ error: message }, 500, req);
  }
});
