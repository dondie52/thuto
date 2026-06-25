# Thuto Revenue Model — Implementation Plan

Unified plan for **B2C Pro restructure** and **B2B University partner package**. This document reflects what was implemented in the codebase.

## Strategic framing

| Stream | Audience | Model |
|--------|----------|-------|
| **Thuto Free** | Students | Discovery, 2 saves, 2 compare, 3 AI/day, banner ads |
| **Thuto Pro** | Students | P59/year or P199/5-year one-time; unlimited tools, no ads |
| **University Partners** | Institutions | Verified profiles, self-service admin, analytics, featured placement, leads |

Students stay free-first. Universities pay for accuracy, trust, visibility, and qualified leads.

---

## B2C: Thuto Pro restructure

### Phase 1 — Pricing & plan model ✅

- `PREMIUM_PLANS`: `yearly` (P59) and `five_year` (P199) only in UI
- Stripe checkout: one-time `payment` mode for both plans
- Webhook sets `premium_until` to +1 year or +5 years
- Legacy plans (`monthly`, `annual`, `season_pass`) grandfathered in DB constraint
- Routes: `/upgrade/success`, `/upgrade/cancel`
- Free vs Pro comparison table on `/upgrade`

**Key files:** `src/lib/premium.js`, `supabase/functions/create-checkout-session/`, `supabase/functions/stripe-webhook/`, `docs/STRIPE_SETUP.md`

### Phase 2 — Enforce limits ✅

- `src/lib/entitlements.js` — single source of truth for Free vs Pro
- Compare: 2 free / 3 Pro (dynamic tooltips)
- Saves: 2 free / unlimited Pro (`bookmarks.js` + server trigger on `user_bookmarks`)
- AI: 3/day free, unlimited Pro (`recordAssistantUsage` wired in `Assistant.jsx`)
- Acceptance chance: gated behind Pro (`ProgrammeDetail.jsx`)
- Grade import: `CertificateImportCard` Pro-only (`Predictor.jsx`)

### Phase 3 — New Pro features ✅

- Salary estimates: `src/lib/careerSalaries.js` (indicative bands)
- Documents checklist: `DocumentsChecklist.jsx`
- PDF download/share: `PdfExportButton.jsx`
- Banner ads: `AdBanner.jsx` in `Layout.jsx` for free tier
- Support tiers: `SupportHub.jsx` on `/support`
- Notification prefs extended: `notificationPreferences.js` + `PRO_ALERT_OPTIONS` (alerts stubbed)

### Phase 4 — Polish ✅

- Admin premium plan dropdown: yearly / five_year / legacy
- Analytics events: `src/lib/analytics.js` (`limit_hit`, `upgrade_prompt`, views, apply clicks)
- Profile types updated for new plan IDs

---

## B2B: University partner package

### Phase 0 — Foundations ✅

**Migration:** `supabase/migrations/20260625120000_revenue_model_and_partners.sql`

- `institution_partners`, `institution_users`, `institution_claims`
- `featured_placements`, `institution_leads`, `institution_analytics_daily`
- Institution-scoped RLS on content overrides
- `assistant_daily_usage` + `record_assistant_usage()` RPC

### Phase 1 — Verified profiles + self-service CMS ✅

- `/partner` portal: dashboard, profile editor, programme editor, claim flow
- `InstitutionVerificationBadge` on institution list + detail pages
- Partner save helpers: `src/lib/partner.js`

### Phase 2 — Analytics ✅

- Client instrumentation: `programme_view`, `institution_profile_view`, `apply_click`
- Partner dashboard reads `institution_analytics_daily`
- Rollup function: `rollup_institution_analytics()` (cron-ready)

### Phase 3 — Featured placement ✅

- `featured_placements` table + public read policy
- `fetchActiveFeaturedPlacements()` boosts sort on `/universities`
- “Sponsored” label when placement active

### Phase 4 — Apply integration ✅

- `buildTrackedApplyUrl()` — UTM + `thuto_institution` params
- Apply click tracking via `/go` interstitial (`ExternalRedirect.jsx`)
- `ExternalSiteLink` passes `programmeId` / `institutionId`

### Phase 5 — Lead gen ✅

- `LeadInquiryForm.jsx` on verified institution + programme pages
- `institution_leads` with consent checkbox
- Partner lead inbox in `/partner`

---

## Ops checklist

1. Apply Supabase migration
2. Create Stripe products: `STRIPE_PRICE_YEARLY`, `STRIPE_PRICE_FIVE_YEAR`
3. Seed pilot partner: insert `institution_partners` + `institution_users`
4. Run `rollup_institution_analytics()` daily (cron) once traffic exists
5. Configure `STRIPE_PRICE_*` env vars per `docs/STRIPE_SETUP.md`

---

## Open decisions (product)

1. **Payment model:** Implemented as one-time P59/P199 (fixed duration access)
2. **Legacy subscribers:** Honor until `premium_until`; hide old plans in UI
3. **Salary data:** Indicative bands by career keyword (refine with real data later)
4. **Alert pipeline:** UI + prefs stubbed; Twilio/WhatsApp/push TBD
5. **Free messaging:** Not gated in this release (existing `message_privacy` unchanged)

---

## Success metrics

- Free → Pro: `limit_hit` → `/upgrade` → `premium_activated`
- Partner value: profile views, apply clicks, lead volume per institution
- Pro retention: active users at 12 months post-purchase
