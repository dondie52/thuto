import { Link } from "react-router-dom";
import LandingReveal from "./LandingReveal.jsx";

export default function PartnersTeaser({ content }) {
  if (!content?.heading) return null;

  return (
    <section id="partners" className="scroll-mt-24 border-t border-slate-100 bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal className="mx-auto max-w-3xl rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white p-6 text-center shadow-sm sm:p-8">
          <h2 className="font-display text-xl font-bold text-brand-950 sm:text-2xl">{content.heading}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{content.body}</p>
          <Link
            to={content.to || "/partners"}
            className="landing-motion-press mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            {content.ctaLabel || "Explore partnerships"}
          </Link>
        </LandingReveal>
      </div>
    </section>
  );
}
