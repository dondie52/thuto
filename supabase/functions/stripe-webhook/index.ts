import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { jsonResponse } from "../_shared/cors.ts";
import { activatePremium } from "../_shared/premiumActivation.ts";
import { getStripe, planAccessUntil } from "../_shared/stripe.ts";

function subscriptionUntil(sub: Stripe.Subscription): string | null {
  const end = sub.current_period_end;
  if (!end) return null;
  return new Date(end * 1000).toISOString();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const stripe = getStripe();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return jsonResponse({ error: "Webhook secret not configured" }, 503);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return jsonResponse({ error: "Missing signature" }, 400);
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return jsonResponse({ error: message }, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id || session.client_reference_id;
        const planId = session.metadata?.plan_id || "yearly";
        if (!userId) break;

        if (session.mode === "payment") {
          await activatePremium(userId, planId, planAccessUntil(planId));
        } else if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(String(session.subscription));
          await activatePremium(userId, planId, subscriptionUntil(sub));
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;
        const planId = sub.metadata?.plan_id || "monthly";
        if (sub.status === "active" || sub.status === "trialing") {
          await activatePremium(userId, planId, subscriptionUntil(sub));
        } else if (sub.status === "past_due") {
          await activatePremium(userId, planId, subscriptionUntil(sub), "past_due");
        } else if (sub.status === "canceled" || sub.status === "unpaid") {
          await activatePremium(userId, planId, subscriptionUntil(sub), "canceled");
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (userId) {
          await activatePremium(userId, sub.metadata?.plan_id || "monthly", new Date().toISOString(), "canceled");
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription;
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(String(subId));
        const userId = sub.metadata?.supabase_user_id;
        if (userId) {
          await activatePremium(userId, sub.metadata?.plan_id || "monthly", subscriptionUntil(sub), "past_due");
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    console.error("stripe-webhook:", message);
    return jsonResponse({ error: message }, 500);
  }

  return jsonResponse({ received: true });
});
