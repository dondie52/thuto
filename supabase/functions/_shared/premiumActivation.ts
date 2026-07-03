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
  paid: boolean;
};

export async function fulfillDpoPayment(
  companyRef: string,
  verified: VerifiedPayment,
  providerRefs: { transToken?: string; transRef?: string },
): Promise<{ ok: boolean; alreadyCompleted?: boolean; error?: string }> {
  if (!verified.paid) {
    return { ok: false, error: "Payment not successful" };
  }

  const admin = getSupabaseAdmin();
  const { data: txn, error: txnError } = await admin
    .from("payment_transactions")
    .select("id, user_id, plan_id, amount, currency, status")
    .eq("tx_ref", companyRef)
    .maybeSingle();

  if (txnError) {
    console.error("fulfillDpoPayment lookup:", txnError.message);
    return { ok: false, error: "Could not load payment record" };
  }
  if (!txn) {
    return { ok: false, error: "Unknown transaction reference" };
  }
  if (txn.status === "completed") {
    return { ok: true, alreadyCompleted: true };
  }

  const expectedAmount = Number(txn.amount);
  const paidAmount = Number(verified.amount);
  if (Math.abs(expectedAmount - paidAmount) > 0.01) {
    return { ok: false, error: "Amount mismatch" };
  }
  if (String(txn.currency).toUpperCase() !== String(verified.currency).toUpperCase()) {
    return { ok: false, error: "Currency mismatch" };
  }

  const until = planAccessUntil(txn.plan_id);
  await activatePremium(txn.user_id, txn.plan_id, until, "active", "dpo");

  const updatePayload: Record<string, unknown> = {
    status: "completed",
    completed_at: new Date().toISOString(),
  };
  if (providerRefs.transToken) updatePayload.dpo_trans_token = providerRefs.transToken;
  if (providerRefs.transRef) updatePayload.provider_transaction_id = providerRefs.transRef;

  const { error: updateError } = await admin
    .from("payment_transactions")
    .update(updatePayload)
    .eq("id", txn.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("fulfillDpoPayment update:", updateError.message);
    return { ok: false, error: "Could not finalize payment record" };
  }

  return { ok: true };
}
