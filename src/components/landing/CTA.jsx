import { Link } from "react-router-dom";
import LandingReveal from "./LandingReveal.jsx";

export default function CTA() {
  return (
    <section className="bg-brand-800 py-16 sm:py-20" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <LandingReveal
          as="h2"
          id="cta-heading"
          className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl"
        >
          Check eligibility before you build your shortlist
        </LandingReveal>
        <LandingReveal as="p" className="mx-auto mt-3 max-w-lg text-base text-brand-100" delay={80}>
          Use real or estimated grades to get an indicative match list, then save or compare the programmes worth a closer look.
        </LandingReveal>
        <LandingReveal
          as={Link}
          to="/predictor"
          className="focus-ring-on-dark landing-motion-press mt-8 inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-brand-900 shadow-lg hover:bg-brand-50"
          delay={170}
        >
          Check eligibility
        </LandingReveal>
      </div>
    </section>
  );
}
