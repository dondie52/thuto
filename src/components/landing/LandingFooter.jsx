import { Link } from "react-router-dom";
import { landingTo, useLandingAuth } from "./LandingAuthContext.jsx";

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/thutostudyinafrica",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
        <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/thuto_study_in_africa",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-5 w-5">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@thuto_africa",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
        <path d="M16.6 5.82a4.28 4.28 0 0 1-2.63-1.44V4h-3.02v12.4a2.4 2.4 0 1 1-1.7-2.3v-3.1a5.5 5.5 0 1 0 4.72 5.44V9.4a7.26 7.26 0 0 0 4.15 1.3V7.66a4.27 4.27 0 0 1-1.52-1.84Z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/thuto-study-in-africa/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
        <path d="M6.94 8.5H3.56V20.5H6.94V8.5ZM5.25 3.5a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM20.5 20.5h-3.38v-6.09c0-1.45-.03-3.32-2.02-3.32-2.03 0-2.34 1.58-2.34 3.22v6.19H9.38V8.5h3.24v1.64h.05c.45-.85 1.56-1.75 3.2-1.75 3.42 0 4.63 2.31 4.63 5.32V20.5Z" />
      </svg>
    ),
  },
];

export default function LandingFooter({ content }) {
  const { isSignedIn } = useLandingAuth();

  return (
    <footer className="border-t border-slate-200 bg-[var(--thuto-surface)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-display text-xl font-bold text-brand-800">{content?.brand}</p>
            <p className="mt-1 text-sm text-slate-600">{content?.tagline}</p>
            <Link
              to={landingTo(isSignedIn, "/app", "#features")}
              className="landing-motion-press mt-4 inline-flex rounded-md text-sm font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 hover:text-brand-900"
            >
              {isSignedIn ? content?.signedInCta : content?.guestCta}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-12" aria-label="Footer">
            <nav aria-label="Explore">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Explore</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li><Link to="/programmes" className="font-medium text-slate-700 hover:text-brand-800">Programmes</Link></li>
                <li><Link to="/postgraduate-studies" className="font-medium text-slate-700 hover:text-brand-800">Postgraduate Studies</Link></li>
                <li><Link to="/universities" className="font-medium text-slate-700 hover:text-brand-800">Tertiary Institutions</Link></li>
                <li><Link to="/center" className="font-medium text-slate-700 hover:text-brand-800">Thuto Centre</Link></li>
                <li><Link to="/sponsorships" className="font-medium text-slate-700 hover:text-brand-800">Sponsorships</Link></li>
                <li><Link to="/applications" className="font-medium text-slate-700 hover:text-brand-800">My Applications</Link></li>
              </ul>
            </nav>
            <nav aria-label="Tools">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Tools</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li><Link to="/assistant" className="font-medium text-slate-700 hover:text-brand-800">Ask Thuto</Link></li>
                <li><Link to="/feed" className="font-medium text-slate-700 hover:text-brand-800">Feed</Link></li>
                <li><Link to="/fit-finder" className="font-medium text-slate-700 hover:text-brand-800">Fit Finder</Link></li>
                <li><Link to="/predictor" className="font-medium text-slate-700 hover:text-brand-800">Predictor</Link></li>
                <li><Link to="/saved" className="font-medium text-slate-700 hover:text-brand-800">Saved Programmes</Link></li>
                <li><Link to="/compare" className="font-medium text-slate-700 hover:text-brand-800">Compare Programmes</Link></li>
              </ul>
            </nav>
            <nav aria-label="Company">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Company</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li><Link to="/partners" className="font-medium text-slate-700 hover:text-brand-800">Partners</Link></li>
                <li><a href="mailto:hello@thuto.bw" className="font-medium text-slate-700 hover:text-brand-800">Contact</a></li>
                <li><Link to="/disclaimer" className="font-medium text-slate-700 hover:text-brand-800">Disclaimer &amp; IP</Link></li>
                <li><Link to="/support" className="font-medium text-slate-700 hover:text-brand-800">Support</Link></li>
                <li><Link to="/privacy" className="font-medium text-slate-700 hover:text-brand-800">Privacy</Link></li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="mt-8 flex items-center gap-3" aria-label="Follow Thuto on social media">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Thuto on ${social.name}`}
              className="landing-motion-press inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
            >
              {social.icon}
            </a>
          ))}
        </div>
        <p className="mt-6 border-t border-slate-100 pt-6 text-xs leading-relaxed text-slate-500">{content?.note}</p>
      </div>
    </footer>
  );
}
