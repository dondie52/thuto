# Stripe and Thuto Pro setup

Use this checklist when connecting payments for Thuto Pro on GitHub Pages + Supabase.

## 1. Stripe Dashboard (test mode first)

1. Create a **Product** named `Thuto Pro`.
2. Create two **one-time Prices** (no recurring monthly billing):
   - **Yearly Pro** (e.g. BWP 59) → copy Price ID → `STRIPE_PRICE_YEARLY`
   - **5-Year Pro** (e.g. BWP 199) → `STRIPE_PRICE_FIVE_YEAR`
3. Optional legacy env aliases (grandfathered subscribers only):
   - `STRIPE_PRICE_SEASON` may point to the yearly price during migration
   - `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` if old subscriptions still exist
4. Enable **Customer Portal** (Settings → Billing → Customer portal) for receipts and payment history.
5. Add a **Webhook** endpoint:
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## 2. Supabase

1. Apply migrations including `supabase/migrations/20260522000000_profiles_and_premium.sql` and `supabase/migrations/20260625140000_subscription_restructure.sql`.
2. Deploy edge functions:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy create-portal-session
   supabase functions deploy stripe-webhook --no-verify-jwt
   supabase functions deploy assistant
   ```
3. Set secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   supabase secrets set STRIPE_PRICE_YEARLY=price_...
   supabase secrets set STRIPE_PRICE_FIVE_YEAR=price_...
   supabase secrets set SITE_URL=https://dondie52.github.io/thuto
   ```

`SITE_URL` must match your deployed app origin (no trailing slash), including GitHub Pages base path if applicable.

## 3. GitHub Actions / local `.env`

| Variable | Where |
|----------|--------|
| `VITE_SUPABASE_URL` | GitHub secret + `.env` |
| `VITE_SUPABASE_ANON_KEY` | GitHub secret + `.env` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional display-only; checkout uses hosted Stripe pages |

## 4. End-to-end test (test mode)

1. Sign up on `/auth`.
2. Open `/upgrade` → choose **Yearly Pro (P59)** or **5-Year Pro (P199)** → complete Stripe test card `4242 4242 4242 4242`.
3. Land on `/upgrade/success` → refresh profile on `/profile`.
4. Confirm `profiles.premium_status = active` and `premium_plan` is `yearly` or `five_year`.
5. Compare page allows **3** programmes when Pro, **2** when Free.
6. Free AI assistant stops after **3** questions per day.
7. Open **Manage billing** on Settings → Stripe portal opens (receipts/history).

## 5. Go live

1. Swap Stripe keys to live mode; update webhook URL and secrets.
2. Update Privacy and Disclaimer (Thuto Pro one-time plans).
3. Remove test-only banners if any remain.

## Monetization model

- **Thuto Free**: banner ads, limited saves/compare/AI, community support.
- **Thuto Pro**: one-time **P59/year** or **P199/5-year** — no monthly subscription.
- Future: family plan, sponsored listings (separate Stripe products).
