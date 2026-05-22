import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

export function getStripe() {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient() });
}

export function getPriceId(planId: string): string | null {
  const map: Record<string, string | undefined> = {
    monthly: Deno.env.get("STRIPE_PRICE_MONTHLY"),
    annual: Deno.env.get("STRIPE_PRICE_ANNUAL"),
    season_pass: Deno.env.get("STRIPE_PRICE_SEASON"),
  };
  return map[planId] || null;
}

export function getSiteUrl() {
  const url = (Deno.env.get("SITE_URL") || Deno.env.get("VITE_SITE_URL") || "http://localhost:5173").trim();
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
