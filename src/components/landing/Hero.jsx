import { Link } from "react-router-dom";
import { landingTo, useLandingAuth } from "./LandingAuthContext.jsx";
import { resolveProgrammeThemeUrl } from "../../lib/programmeBranding.js";

export default function Hero({ content }) {
  const { isSignedIn } = useLandingAuth();
  const heroImage = resolveProgrammeThemeUrl(content?.image || "programme-themes/landing-hero-bw.jpg");
  const stats = Array.isArray(content?.stats) ? content.stats : [];

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-brand-950 pb-14 pt-28 sm:pb-20 sm:pt-32">
      <div
        className="landing-hero-image absolute inset-0 bg-slate-900 bg-cover bg-[center_35%]"
        style={{ backgroundImage: `url("${heroImage}")` }}
        aria-hidden
      />
      <div
        className="landing-hero-shade absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/75 to-brand-950/30 sm:bg-[linear-gradient(90deg,rgba(4,47,46,0.94)_0%,rgba(4,47,46,0.82)_38%,rgba(4,47,46,0.42)_66%,rgba(4,47,46,0.18)_100%)]"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--thuto-surface)] to-transparent" aria-hidden />
      <div className="absolute left-4 top-24 hidden h-0.5 w-12 bg-brand-300/80 sm:block sm:left-6 md:left-10" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6">
        <p className="landing-hero-kicker text-xs font-semibold uppercase tracking-[0.28em] text-brand-200 sm:text-sm">
          {content?.kicker}
        </p>
        <h1
          className="landing-hero-title mt-5 max-w-4xl font-display text-4xl font-bold leading-[1.04] tracking-tight text-white sm:mt-6 sm:text-6xl lg:text-7xl"
          style={{ maxWidth: "16ch" }}
        >
          {content?.title}
        </h1>
        <p className="landing-hero-copy mt-6 max-w-xl text-base leading-7 text-slate-100/90 sm:mt-7 sm:text-lg">
          {content?.body}
        </p>
        <div className="landing-hero-actions mt-8 flex flex-wrap items-center gap-3 sm:mt-10">
          <Link
            to="/predictor"
            className="focus-ring-on-dark landing-motion-press inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand-900 shadow-lg ring-1 ring-white/60 hover:bg-brand-50 hover:shadow-xl"
          >
            {content?.primaryCtaLabel}
          </Link>
          <Link
            to={landingTo(isSignedIn, "/programmes", "#programmes")}
            className="focus-ring-on-dark landing-motion-press inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white shadow-sm backdrop-blur-sm hover:border-white/50 hover:bg-white/20"
          >
            {content?.secondaryCtaLabel}
          </Link>
        </div>

        {stats.length ? (
          <dl className="landing-hero-stats mt-12 flex max-w-xl flex-wrap gap-x-10 gap-y-6 border-t border-white/12 pt-8 sm:mt-16">
            {stats.map((item, index) => (
              <div key={`${item.label}-${index}`} className="landing-hero-stat" style={{ "--stat-delay": `${680 + index * 130}ms` }}>
                <dd className="font-display text-3xl font-bold leading-none text-white">{item.value}</dd>
                <dt className="mt-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-200/80">{item.label}</dt>
              </div>
            ))}
          </dl>
        ) : null}
        <p className="landing-hero-note mt-6 max-w-xl text-sm leading-6 text-slate-300/85">{content?.note}</p>
      </div>
    </section>
  );
}
