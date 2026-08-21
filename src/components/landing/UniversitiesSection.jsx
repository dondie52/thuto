import { Link } from "react-router-dom";
import { landingTo, useLandingAuth } from "./LandingAuthContext.jsx";
import LandingReveal from "./LandingReveal.jsx";

const universityLogosSrc = `${import.meta.env.BASE_URL}landing/university-logos.png`;

export default function UniversitiesSection({ content }) {
  const { isSignedIn } = useLandingAuth();

  return (
    <section
      id="universities"
      className="scroll-mt-24 overflow-hidden border-t border-emerald-950/10 bg-[var(--thuto-surface-elevated)] py-16 sm:py-24"
      aria-labelledby="unis-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">{content?.kicker}</p>
            <LandingReveal
              as="h2"
              id="unis-heading"
              className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
            >
              {content?.heading}
            </LandingReveal>
            <LandingReveal as="p" className="mt-4 max-w-xl text-base leading-relaxed text-slate-600" delay={80}>
              {content?.body}
            </LandingReveal>
          </div>

          <LandingReveal
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            delay={140}
          >
            <img
              src={universityLogosSrc}
              alt="Logos of universities and colleges on Thuto, including University of Botswana, UNAM, University of Zimbabwe, UCT, Wits, Stellenbosch, and more."
              width={1105}
              height={1080}
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
          </LandingReveal>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to={landingTo(isSignedIn, "/universities", "#universities")}
              className="focus-ring landing-motion-press inline-flex min-h-11 items-center justify-center rounded-md bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-800"
            >
              {isSignedIn ? content?.ctaSignedIn : content?.ctaGuest}
            </Link>
            <span className="text-sm text-slate-500">{content?.note}</span>
          </div>
          {content?.affiliationNote ? (
            <p className="max-w-3xl text-xs leading-relaxed text-slate-500">{content.affiliationNote}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
