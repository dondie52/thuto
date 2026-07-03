export const VALID_PREMIUM_PLANS = new Set(["yearly", "five_year"]);
export const LEGACY_SUBSCRIPTION_PLANS = new Set(["monthly", "annual"]);

export function isValidPlanId(planId: string): boolean {
  return VALID_PREMIUM_PLANS.has(planId) || LEGACY_SUBSCRIPTION_PLANS.has(planId);
}

export function planAccessUntil(planId: string): string {
  const until = new Date();
  if (planId === "five_year") {
    until.setFullYear(until.getFullYear() + 5);
  } else if (planId === "monthly") {
    until.setMonth(until.getMonth() + 1);
  } else {
    until.setFullYear(until.getFullYear() + 1);
  }
  return until.toISOString();
}

export function getDpoPlanAmount(planId: string): number | null {
  const envMap: Record<string, string | undefined> = {
    yearly: Deno.env.get("DPO_AMOUNT_YEARLY"),
    five_year: Deno.env.get("DPO_AMOUNT_FIVE_YEAR"),
  };
  const raw = envMap[planId];
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (planId === "yearly") return 59;
  if (planId === "five_year") return 199;
  return null;
}

export function getPlanDescription(planId: string): string {
  switch (planId) {
    case "five_year":
      return "Thuto Pro — 5 years access";
    case "yearly":
    default:
      return "Thuto Pro — 1 year access";
  }
}
