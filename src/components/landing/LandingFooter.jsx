import { Link } from "react-router-dom";
import { landingTo, useLandingAuth } from "./LandingAuthContext.jsx";

export default function LandingFooter({ content }) {
  const { isSignedIn } = useLandingAuth();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-brand-800">{content?.brand}</p>
            <p className="mt-1 text-sm text-slate-600">{content?.tagline}</p>
            <Link
              to={landingTo(isSignedIn, "/app", "#features")}
              className="landing-motion-press mt-4 inline-flex rounded-md text-sm font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 hover:text-brand-900"
            >
              {isSignedIn ? content?.signedInCta : content?.guestCta}
            </Link>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm" aria-label="Footer">
            <a href="#about" className="font-medium text-slate-700 hover:text-brand-800">
              About
            </a>
            <Link to="/sponsorships" className="font-medium text-slate-700 hover:text-brand-800">
              Sponsorships
            </Link>
            <Link to="/internships" className="font-medium text-slate-700 hover:text-brand-800">
              Internships
            </Link>
            <a href="mailto:hello@thuto.bw" className="font-medium text-slate-700 hover:text-brand-800">
              Contact
            </a>
            <Link to="/disclaimer" className="font-medium text-slate-700 hover:text-brand-800">
              Disclaimer
            </Link>
            <Link to="/disclaimer#content-removal" className="font-medium text-slate-700 hover:text-brand-800">
              IP &amp; Content Removal
            </Link>
            <Link to="/privacy" className="font-medium text-slate-700 hover:text-brand-800">
              Privacy
            </Link>
          </nav>
        </div>
        <p className="mt-8 border-t border-slate-100 pt-6 text-xs leading-relaxed text-slate-500">{content?.note}</p>
      </div>
    </footer>
  );
}
