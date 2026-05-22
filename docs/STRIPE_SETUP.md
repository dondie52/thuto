# Stripe and Thuto Premium setup

Use this checklist when connecting payments for Thuto Premium on GitHub Pages + Supabase.

## 1. Stripe Dashboard (test mode first)

1. Create a **Product** named `Thuto Premium`.
2. Create three **Prices**:
   - **Monthly** recurring (e.g. BWP 35/month) → copy Price ID → `STRIPE_PRICE_MONTHLY`
   - **Annual** recurring (e.g. BWP 350/year) → `STRIPE_PRICE_ANNUAL`
   - **Season pass** one-time (e.g. BWP 99) → `STRIPE_PRICE_SEASON`
3. Enable **Customer Portal** (Settings → Billing → Customer portal) for subscription management.
4. Add a **Webhook** endpoint:
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## 2. Supabase

1. Apply migration `supabase/migrations/20260522000000_profiles_and_premium.sql` (CLI `supabase db push` or SQL editor).
2. Deploy edge functions:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy create-portal-session
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
3. Set secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   supabase secrets set STRIPE_PRICE_MONTHLY=price_...
   supabase secrets set STRIPE_PRICE_ANNUAL=price_...
   supabase secrets set STRIPE_PRICE_SEASON=price_...
   supabase secrets set SITE_URL=https://dondie52.github.io/thuto
   ```
   `SITE_URL` must match your deployed app origin (no trailing slash), including GitHub Pages base path if applicable.

## 3. GitHub Actions / local `.env`

| Variable | Where |
|----------|--------|
| `VITE_SUPABASE_URL` | GitHub secret + `.env` |
| `VITE_SUPABASE_ANON_KEY` | GitHub secret + `.env` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional display-only; checkout uses hosted Stripe pages |

`deploy.yml` already passes Supabase vars; add `VITE_STRIPE_PUBLISHABLE_KEY` if you surface Stripe.js later.

## 4. End-to-end test (test mode)

1. Sign up on `/auth`.
2. Open `/upgrade` → choose a plan → complete Stripe test card `4242 4242 4242 4242`.
3. Land on `/upgrade/success` → **Refresh status** on Profile.
4. Confirm `profiles.premium_status = active` in Supabase Table Editor.
5. Compare page allows **5** programmes when premium.
6. Open **Manage subscription** on Settings → Stripe portal opens.
7. Cancel in portal → webhook sets status to `canceled`.

## 5. Go live

1. Swap Stripe keys to live mode; update webhook URL and secrets.
2. Update Privacy and Disclaimer (already note Thuto Premium vs university fees).
3. Remove test-only banners if any remain.

## Monetization beyond base Premium

- Nudge **annual** plan on `/upgrade` (default badge).
- **Season pass** for students who avoid subscriptions.
- Future: family plan, AI add-on packs, sponsored listings (separate Stripe products).
