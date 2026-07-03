import { jsonResponse } from "../_shared/cors.ts";
import { isDpoPaidResult, verifyDpoToken } from "../_shared/dpo.ts";
import { fulfillDpoPayment } from "../_shared/premiumActivation.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";

async function handleVerification(companyRef: string, transToken: string) {
  const verified = await verifyDpoToken(transToken, companyRef);
  if (!isDpoPaidResult(verified.Result)) {
    return jsonResponse({ received: true, paid: false, result: verified.Result || null });
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
    console.error("dpo-webhook fulfill:", result.error);
    return jsonResponse({ error: result.error || "Fulfillment failed" }, 400);
  }

  return jsonResponse({ received: true, fulfilled: true });
}

Deno.serve(async (req) => {
  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const companyRef = String(url.searchParams.get("CompanyRef") || url.searchParams.get("company_ref") || "").trim();
      const transToken = String(
        url.searchParams.get("TransactionToken") || url.searchParams.get("TransToken") || "",
      ).trim();

      if (!companyRef || !transToken) {
        return jsonResponse({ error: "Missing callback parameters" }, 400);
      }

      return await handleVerification(companyRef, transToken);
    }

    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      let companyRef = "";
      let transToken = "";

      if (contentType.includes("application/json")) {
        const payload = await req.json().catch(() => ({}));
        companyRef = String(payload?.merchantOrderId || payload?.CompanyRef || payload?.companyRef || "").trim();
        transToken = String(payload?.transactionToken || payload?.TransactionToken || payload?.transToken || "").trim();

        if (!transToken && companyRef) {
          const admin = getSupabaseAdmin();
          const { data: txn } = await admin
            .from("payment_transactions")
            .select("dpo_trans_token")
            .eq("tx_ref", companyRef)
            .maybeSingle();
          transToken = String(txn?.dpo_trans_token || "").trim();
        }
      } else {
        const text = await req.text();
        const params = new URLSearchParams(text);
        companyRef = String(params.get("CompanyRef") || params.get("company_ref") || "").trim();
        transToken = String(params.get("TransactionToken") || params.get("TransToken") || "").trim();
      }

      if (!companyRef || !transToken) {
        return jsonResponse({ error: "Missing push notification fields" }, 400);
      }

      return await handleVerification(companyRef, transToken);
    }

    return jsonResponse({ error: "Method not allowed" }, 405);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    console.error("dpo-webhook:", message);
    return jsonResponse({ error: message }, 500);
  }
});
