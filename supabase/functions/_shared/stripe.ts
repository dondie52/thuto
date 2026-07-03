import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { planAccessUntil } from "./premiumPlans.ts";

export { planAccessUntil } from "./premiumPlans.ts";
export { getSiteUrl } from "./siteUrl.ts";

export function getStripe() {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient() });
}

export function getPriceId(planId: string): string | null {
  const map: Record<string, string | undefined> = {
    yearly: Deno.env.get("STRIPE_PRICE_YEARLY") || Deno.env.get("STRIPE_PRICE_SEASON"),
    five_year: Deno.env.get("STRIPE_PRICE_FIVE_YEAR"),
    // Legacy plans (grandfathered subscribers / admin)
    monthly: Deno.env.get("STRIPE_PRICE_MONTHLY"),
    annual: Deno.env.get("STRIPE_PRICE_ANNUAL"),
    season_pass: Deno.env.get("STRIPE_PRICE_SEASON") || Deno.env.get("STRIPE_PRICE_YEARLY"),
  };
  return map[planId] || null;
}
