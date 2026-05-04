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
        <h2 className="font-display text-lg font-semibold text-brand-900">Device storage</h2>
        <p>
          Bookmarks, compare selections, predictor inputs, and rate limits for the share form may be stored in your browser
          (for example localStorage). This stays on your device unless you clear site data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-brand-900">Third parties</h2>
        <p>
          Universities you open in a new tab set their own policies. Thuto does not process university applications or
          payments on your behalf.
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
