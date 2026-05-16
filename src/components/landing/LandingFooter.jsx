import { Link } from "react-router-dom";

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-brand-800">Thuto</p>
            <p className="mt-1 text-sm text-slate-600">Botswana University Companion</p>
            <Link
              to="/app"
              className="landing-motion-press mt-4 inline-flex rounded-md text-sm font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 hover:text-brand-900"
            >
              Open full app
            </Link>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm" aria-label="Footer">
            <a href="#about" className="font-medium text-slate-700 hover:text-brand-800">
              About
            </a>
            <a href="mailto:hello@thuto.bw" className="font-medium text-slate-700 hover:text-brand-800">
              Contact
            </a>
            <Link to="/disclaimer" className="font-medium text-slate-700 hover:text-brand-800">
              Disclaimer
            </Link>
            <Link to="/privacy" className="font-medium text-slate-700 hover:text-brand-800">
              Privacy
            </Link>
          </nav>
        </div>
        <p className="mt-8 border-t border-slate-100 pt-6 text-xs leading-relaxed text-slate-500">
          Thuto does not process applications or payments. Eligibility and programme details in the app are indicative; confirm
          with each university.
        </p>
      </div>
    </footer>
  );
}
