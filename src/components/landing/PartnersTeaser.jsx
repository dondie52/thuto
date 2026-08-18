import { Link } from "react-router-dom";
import LandingReveal from "./LandingReveal.jsx";

export default function PartnersTeaser({ content }) {
  if (!content?.heading) return null;

  return (
    <section id="partners" className="scroll-mt-24 bg-[var(--thuto-surface)] py-16 text-center sm:py-24">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <LandingReveal as="p" className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Institutions &amp; Employers
        </LandingReveal>
        <LandingReveal as="h2" className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl" delay={70}>
          {content.heading}
        </LandingReveal>
        <LandingReveal as="p" className="mt-5 text-base leading-relaxed text-slate-600" delay={140}>
          {content.body}
        </LandingReveal>
        <LandingReveal delay={200} className="mt-8">
          <Link
            to={content.to || "/partners"}
            className="landing-motion-press inline-flex min-h-[48px] items-center justify-center rounded-full bg-brand-700 px-8 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-brand-800"
          >
            {content.ctaLabel || "Explore partnerships"}
          </Link>
        </LandingReveal>
      </div>
    </section>
  );
}
