import { Link } from "react-router-dom";

export default function PartnersCta({ content, onBookDemo }) {
  function handleBookDemo(event) {
    event.preventDefault();
    onBookDemo?.();
  }

  return (
    <section className="rounded-2xl bg-brand-800 px-5 py-10 text-center sm:px-8 sm:py-12" aria-labelledby="partners-cta-heading">
      <h2 id="partners-cta-heading" className="font-display text-2xl font-bold text-white sm:text-3xl">
        {content?.heading}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-brand-100 sm:text-base">{content?.body}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#partner-inquiry"
          onClick={handleBookDemo}
          className="focus-ring-on-dark inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brand-50"
        >
          {content?.primaryCtaLabel}
        </a>
        <Link
          to="/partner"
          className="focus-ring-on-dark inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/35 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
        >
          {content?.secondaryCtaLabel}
        </Link>
      </div>
    </section>
  );
}
