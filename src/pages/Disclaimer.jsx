import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function Disclaimer() {
  useDocumentTitle("Disclaimer | Thuto");

  return (
    <div className="space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base">
      <h1 className="font-display text-2xl font-bold text-brand-900">Disclaimer</h1>
      <p>
        Thuto (Botswana University Companion) provides programme information and rough eligibility estimates for planning
        purposes only. Minimum points, subject rules, fees, and deadlines in the app may be incomplete, out of date, or
        simplified compared with official university sources.
      </p>
      <p>
        Nothing in Thuto constitutes an offer of admission, legal advice, or a substitute for each institution&apos;s official
        prospectus, website, or admissions office. You are responsible for verifying every requirement before you apply or pay
        any fees.
      </p>
      <p>
        <strong className="font-semibold text-slate-900">Thuto does not process applications or payments.</strong> We do not
        transmit application forms to universities on your behalf and do not collect application fees.
      </p>
      <p>
        Thuto may use sample or bundled data in development; where live feeds are configured, treat them as convenience only
        and still confirm critical dates directly with the institution.
      </p>
      <p>
        <Link to="/" className="font-semibold text-brand-800 underline hover:text-brand-950">
          Back to home
        </Link>
        {" · "}
        <Link to="/app" className="font-semibold text-brand-800 underline hover:text-brand-950">
          Open app
        </Link>
        {" · "}
        <Link to="/privacy" className="font-semibold text-brand-800 underline hover:text-brand-950">
          Privacy
        </Link>
      </p>
    </div>
  );
}
