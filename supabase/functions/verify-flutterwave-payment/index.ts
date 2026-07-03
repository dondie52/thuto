import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { verifyFlutterwaveTransaction } from "../_shared/flutterwave.ts";
import { fulfillFlutterwavePayment } from "../_shared/premiumActivation.ts";
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
    const txRef = String(body?.txRef || body?.tx_ref || "").trim();
    const transactionId = String(body?.transactionId || body?.transaction_id || "").trim();
    const redirectStatus = String(body?.status || "").trim().toLowerCase();

    if (!txRef || !transactionId) {
      return jsonResponse({ error: "Missing payment reference" }, 400, req);
    }
    if (redirectStatus && redirectStatus !== "successful" && redirectStatus !== "completed") {
      return jsonResponse({ error: "Payment was not completed", status: redirectStatus }, 400, req);
    }

    const admin = getSupabaseAdmin();
    const { data: txn } = await admin
      .from("payment_transactions")
      .select("user_id, status")
      .eq("tx_ref", txRef)
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

    const verified = await verifyFlutterwaveTransaction(transactionId);
    const verifiedData = verified?.data;
    if (!verifiedData || verified?.status !== "success") {
      return jsonResponse({ error: "Could not verify payment" }, 400, req);
    }

    if (String(verifiedData.tx_ref) !== txRef) {
      return jsonResponse({ error: "Payment reference mismatch" }, 400, req);
    }

    const result = await fulfillFlutterwavePayment(txRef, transactionId, {
      amount: Number(verifiedData.amount),
      currency: String(verifiedData.currency || ""),
      status: String(verifiedData.status || ""),
    });

    if (!result.ok && !result.alreadyCompleted) {
      return jsonResponse({ error: result.error || "Could not activate Pro" }, 400, req);
    }

    return jsonResponse({ ok: true, alreadyCompleted: Boolean(result.alreadyCompleted) }, 200, req);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    console.error("verify-flutterwave-payment:", message);
    return jsonResponse({ error: message }, 500, req);
  }
});
