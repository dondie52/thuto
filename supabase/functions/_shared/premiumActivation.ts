import { getSupabaseAdmin } from "./supabaseAdmin.ts";
import { planAccessUntil } from "./premiumPlans.ts";

export async function activatePremium(
  userId: string,
  plan: string,
  until: string | null,
  status: "active" | "past_due" | "canceled" = "active",
  paymentProvider?: string,
) {
  const admin = getSupabaseAdmin();
  const normalizedPlan = plan === "season_pass" ? "yearly" : plan;
  const updates: Record<string, unknown> = {
    premium_status: status,
    premium_plan: status === "active" ? normalizedPlan : null,
    premium_until: until,
    updated_at: new Date().toISOString(),
  };
  if (paymentProvider && status === "active") {
    updates.payment_provider = paymentProvider;
  }

  await admin.from("profiles").update(updates).eq("id", userId);

  await admin.from("analytics_events").insert({
    user_id: userId,
    event_name: status === "active" ? "premium_activated" : `premium_${status}`,
    metadata: { plan: normalizedPlan, payment_provider: paymentProvider || null },
  });
}

type VerifiedPayment = {
  amount: number;
  currency: string;
  status: string;
};

export async function fulfillFlutterwavePayment(
  txRef: string,
  flutterwaveTransactionId: string,
  verified: VerifiedPayment,
): Promise<{ ok: boolean; alreadyCompleted?: boolean; error?: string }> {
  if (verified.status !== "successful") {
    return { ok: false, error: "Payment not successful" };
  }

  const admin = getSupabaseAdmin();
  const { data: txn, error: txnError } = await admin
    .from("payment_transactions")
    .select("id, user_id, plan_id, amount, currency, status")
    .eq("tx_ref", txRef)
    .maybeSingle();

  if (txnError) {
    console.error("fulfillFlutterwavePayment lookup:", txnError.message);
    return { ok: false, error: "Could not load payment record" };
  }
  if (!txn) {
    return { ok: false, error: "Unknown transaction reference" };
  }
  if (txn.status === "completed") {
    return { ok: true, alreadyCompleted: true };
  }

  if (Number(txn.amount) !== Number(verified.amount)) {
    return { ok: false, error: "Amount mismatch" };
  }
  if (String(txn.currency).toUpperCase() !== String(verified.currency).toUpperCase()) {
    return { ok: false, error: "Currency mismatch" };
  }

  const until = planAccessUntil(txn.plan_id);
  await activatePremium(txn.user_id, txn.plan_id, until, "active", "flutterwave");

  const { error: updateError } = await admin
    .from("payment_transactions")
    .update({
      status: "completed",
      flutterwave_transaction_id: String(flutterwaveTransactionId),
      completed_at: new Date().toISOString(),
    })
    .eq("id", txn.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("fulfillFlutterwavePayment update:", updateError.message);
    return { ok: false, error: "Could not finalize payment record" };
  }

  return { ok: true };
}
