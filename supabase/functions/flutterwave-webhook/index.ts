import { jsonResponse } from "../_shared/cors.ts";
import { getFlutterwaveWebhookSecret, verifyFlutterwaveTransaction } from "../_shared/flutterwave.ts";
import { fulfillFlutterwavePayment } from "../_shared/premiumActivation.ts";

type FlutterwaveWebhookPayload = {
  event?: string;
  data?: {
    id?: number;
    tx_ref?: string;
    status?: string;
    amount?: number;
    currency?: string;
  };
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const webhookSecret = getFlutterwaveWebhookSecret();
  if (!webhookSecret) {
    return jsonResponse({ error: "Webhook secret not configured" }, 503);
  }

  const verifHash = req.headers.get("verif-hash");
  if (!verifHash || verifHash !== webhookSecret) {
    return jsonResponse({ error: "Invalid webhook signature" }, 401);
  }

  let payload: FlutterwaveWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const event = payload?.event || "";
  if (event !== "charge.completed") {
    return jsonResponse({ received: true, ignored: true });
  }

  const data = payload?.data;
  const txRef = data?.tx_ref;
  const transactionId = data?.id;
  if (!txRef || !transactionId) {
    return jsonResponse({ error: "Missing transaction details" }, 400);
  }

  try {
    const verified = await verifyFlutterwaveTransaction(transactionId);
    const verifiedData = verified?.data;
    if (!verifiedData || verified?.status !== "success") {
      return jsonResponse({ error: "Could not verify transaction" }, 400);
    }

    const result = await fulfillFlutterwavePayment(String(txRef), String(transactionId), {
      amount: Number(verifiedData.amount),
      currency: String(verifiedData.currency || ""),
      status: String(verifiedData.status || ""),
    });

    if (!result.ok && !result.alreadyCompleted) {
      console.error("flutterwave-webhook fulfill:", result.error);
      return jsonResponse({ error: result.error || "Fulfillment failed" }, 400);
    }

    return jsonResponse({ received: true, fulfilled: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    console.error("flutterwave-webhook:", message);
    return jsonResponse({ error: message }, 500);
  }
});
