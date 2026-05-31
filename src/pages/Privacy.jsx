import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function Privacy() {
  useDocumentTitle("Privacy | Thuto");

  return (
    <div className="space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base">
      <h1 className="font-display text-2xl font-bold text-brand-900">Privacy</h1>
      <p>
        Thuto (Botswana University Companion) is a client-side web app. This page describes what we may collect when you use
        specific features, especially the optional anonymous admission result form.
      </p>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-brand-900">Community submissions</h2>
        <p>
          If you use <Link to="/share" className="font-medium text-brand-700 underline hover:text-brand-900">Share your result</Link>
          , and the site operator has connected a Supabase project, your submission (programme, university label, points total,
          outcome, and application year) is sent to that database. We do not require an account for this flow.
        </p>
        <p>
          New rows are intended to stay hidden from public reads until reviewed (for example, marked verified in the database).
          Only aggregated, verified data should appear on programme pages. If you have questions about a live deployment, contact
          the operator at{" "}
          <a href="mailto:hello@thuto.bw" className="font-medium text-brand-700 underline hover:text-brand-900">
            hello@thuto.bw
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-brand-900">Scroll Feed</h2>
        <p>
          If you use <Link to="/feed" className="font-medium text-brand-700 underline hover:text-brand-900">Scroll Feed</Link>
          , posts, images, comments, reactions, reports, moderation status, and your account user id may be stored in
          Supabase. Feed posts and comments are checked by server-side AI moderation before they appear publicly.
        </p>
        <p>
          Admins can remove, restore, approve, or reject feed content. Do not post private personal information,
          official-looking notices you cannot source, or anything you would not want reviewed by the Thuto team.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-brand-900">Device storage</h2>
        <p>
          Bookmarks, compare selections, predictor inputs, and rate limits for the share form may be stored in your browser
          (for example localStorage). This stays on your device unless you clear site data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-brand-900">Thuto Premium and billing</h2>
        <p>
          If you subscribe to{" "}
          <Link to="/upgrade" className="font-medium text-brand-700 underline hover:text-brand-900">
            Thuto Premium
          </Link>
          , payment is processed by Stripe. We store your subscription status in your Supabase profile (plan type and
          renewal date). We do not store full card numbers. Manage or cancel via the billing portal linked from Settings.
        </p>
        <p>
          Premium may sync saved programmes and predictor snapshots to your account. Core eligibility browsing remains
          available without a paid plan.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-brand-900">Third parties</h2>
        <p>
          Universities you open in a new tab set their own policies. Thuto does not process university application or
          tuition fees on your behalf — only optional Thuto Premium subscriptions for app features.
        </p>
      </section>

      <p className="text-sm text-slate-600">
        <Link to="/disclaimer" className="font-semibold text-brand-800 underline hover:text-brand-950">
          Disclaimer
        </Link>
        {" · "}
        <Link to="/app" className="font-semibold text-brand-800 underline hover:text-brand-950">
          Open app
        </Link>
      </p>
    </div>
  );
}
