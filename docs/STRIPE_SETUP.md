# Stripe and Thuto Pro setup

Use this checklist when connecting payments for Thuto Pro on GitHub Pages + Supabase.

## 1. Stripe Dashboard (test mode first)

1. Create a **Product** named `Thuto Pro`.
2. Create two **one-time Prices**:
   - **Pro Yearly** (e.g. BWP 59) → copy Price ID → `STRIPE_PRICE_YEARLY`
   - **Pro 5-Year** (e.g. BWP 199) → `STRIPE_PRICE_FIVE_YEAR`
3. (Optional legacy) Keep old price IDs mapped for grandfathered subscribers:
   - `STRIPE_PRICE_SEASON` → redirects to yearly in webhook
   - `STRIPE_PRICE_ANNUAL` → redirects to five_year in webhook
   - `STRIPE_PRICE_MONTHLY` → subscription only for legacy monthly users
4. Add a **Webhook** endpoint:
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## 2. Supabase

1. Apply migrations including `supabase/migrations/20260625120000_revenue_model_and_partners.sql`.
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
   supabase secrets set STRIPE_PRICE_YEARLY=price_...
   supabase secrets set STRIPE_PRICE_FIVE_YEAR=price_...
   supabase secrets set SITE_URL=https://your-thuto-origin
   ```

## 3. End-to-end test (test mode)

1. Sign up on `/auth`.
2. Open `/upgrade` → choose **Pro Yearly P59** or **Pro 5-Year P199** → complete Stripe test card `4242 4242 4242 4242`.
3. Land on `/upgrade/success` → refresh profile.
4. Confirm `profiles.premium_status = active` and `premium_plan` is `yearly` or `five_year`.
5. Verify Pro limits: 3 compare, unlimited saves, acceptance chance visible, no ads.
6. Free account: 2 saves, 2 compare, 3 AI questions/day, banner ad on app pages.

## 4. University B2B (partner portal)

1. Seed `institution_partners` and `institution_users` for pilot institutions.
2. Partners log in at `/partner` to edit profiles and view analytics/leads.
3. Verified institutions show badge on `/universities` and `/universities/:id`.
4. Featured placements: insert rows into `featured_placements` for sponsored inventory.

## 5. Go live

1. Swap Stripe keys to live mode; update webhook URL and secrets.
2. Update Privacy and Disclaimer for one-time Pro payment terms.
3. Communicate migration for legacy monthly/season_pass subscribers.
