import { Link } from "react-router-dom";
import LandingReveal from "./LandingReveal.jsx";

export default function CTA({ content }) {
  return (
    <section className="bg-brand-700 py-16 sm:py-20" aria-labelledby="cta-heading">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 text-center sm:px-6 md:flex-row md:items-center md:justify-between md:gap-10 md:text-left">
        <div>
          <LandingReveal
            as="h2"
            id="cta-heading"
            className="max-w-[24ch] font-display text-2xl font-bold tracking-tight text-white sm:text-4xl md:mx-0"
          >
            {content?.heading}
          </LandingReveal>
          <LandingReveal as="p" className="mx-auto mt-3 max-w-lg text-sm text-brand-100 md:mx-0" delay={80}>
            {content?.body}
          </LandingReveal>
        </div>
        <LandingReveal
          as={Link}
          to="/predictor"
          className="focus-ring-on-dark landing-motion-press mx-auto inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-brand-900 shadow-lg hover:bg-brand-50 md:mx-0"
          delay={170}
        >
          {content?.buttonLabel}
        </LandingReveal>
      </div>
    </section>
  );
}
