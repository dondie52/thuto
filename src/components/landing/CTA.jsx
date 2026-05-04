import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="bg-brand-800 py-16 sm:py-20" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <h2 id="cta-heading" className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Start exploring your options
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-base text-brand-100">
          Use the admission predictor with your real or estimated grades, then browse programmes and save what you like on
          this device.
        </p>
        <Link
          to="/predictor"
          className="mt-8 inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-brand-900 shadow-lg transition hover:bg-brand-50"
        >
          Open predictor
        </Link>
      </div>
    </section>
  );
}
