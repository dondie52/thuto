import { Link } from "react-router-dom";
import { resolveProgrammeThemeUrl } from "../../lib/programmeBranding.js";

export default function PartnersHero({ content, onBookDemo }) {
  const heroImage = resolveProgrammeThemeUrl(content?.image || "programme-themes/landing-hero-bw.jpg");

  function handleBookDemo(event) {
    event.preventDefault();
    onBookDemo?.();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">{content?.kicker}</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
            {content?.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">{content?.body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#partner-inquiry"
              onClick={handleBookDemo}
              className="focus-ring inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
            >
              {content?.primaryCtaLabel}
            </a>
            <Link
              to="/partner"
              className="focus-ring inline-flex min-h-[44px] items-center justify-center rounded-full border border-brand-200 bg-white px-6 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              {content?.secondaryCtaLabel}
            </Link>
          </div>
        </div>
        <div
          className="min-h-[14rem] bg-slate-900 bg-cover bg-center lg:min-h-full"
          style={{ backgroundImage: `url("${heroImage}")` }}
          aria-hidden
        />
      </div>
    </section>
  );
}
