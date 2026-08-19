import { Link } from "react-router-dom";
import LandingReveal from "./LandingReveal.jsx";
import { landingTo, useLandingAuth } from "./LandingAuthContext.jsx";

const icons = {
  predictor: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  programmes: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c1.052 0 2.062.18 3 .512V18.75m9-9v-1.5m-9 3v6.75m9-6.75v6.75m-9-3h18M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  universities: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" />
    </svg>
  ),
  compare: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  ),
};

export default function Features({ content }) {
  const { isSignedIn } = useLandingAuth();
  const items = Array.isArray(content?.items) ? content.items : [];

  return (
    <section id="features" className="scroll-mt-24 border-y border-slate-200 bg-[var(--thuto-surface)] py-16 sm:py-24" aria-labelledby="features-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">{content?.heading}</p>
            <LandingReveal
              as="h2"
              id="features-heading"
              className="mt-4 max-w-[18ch] font-display text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl"
              delay={80}
            >
              {content?.introHeading}
            </LandingReveal>
            <LandingReveal as="div" className="mt-6 max-w-[42ch] space-y-3 text-base leading-relaxed text-slate-600" delay={150}>
              <p>{content?.introBody}</p>
              <p>{content?.body}</p>
            </LandingReveal>
          </div>
          <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
            {items.map((item, index) => {
              const href = item.to === "/predictor" ? "/predictor" : landingTo(isSignedIn, item.to, item.guestHash);
              return (
                <LandingReveal as="li" key={`${item.title}-${index}`} delay={index * 90}>
                  <Link to={href} className="landing-motion-card group flex h-full flex-col bg-white p-6">
                    <span className="text-brand-700">{icons[item.icon] || icons.predictor}</span>
                    <h3 className="mt-4 font-display text-base font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-600">{item.body}</p>
                    <span className="mt-4 text-xs font-semibold text-brand-700">
                      {item.to === "/predictor" ? "Check eligibility ->" : isSignedIn ? "Open in app ->" : "Learn more ->"}
                    </span>
                  </Link>
                </LandingReveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
