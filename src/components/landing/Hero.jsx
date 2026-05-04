import { Link } from "react-router-dom";

/**
 * Hero imagery (Unsplash, real photo):
 * https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80
 */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[min(85vh,36rem)] items-end overflow-hidden sm:min-h-[min(78vh,40rem)] sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900 bg-cover bg-center"
        style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/75 to-slate-900/45 sm:bg-gradient-to-r sm:from-slate-950/90 sm:via-slate-900/65 sm:to-slate-900/25"
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-28">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-200 sm:text-sm">Thuto · BUC</p>
        <h1 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-5xl">
          Find the courses you actually qualify for
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-slate-200 sm:text-lg">
          Enter your BGCSE grades, see your points, and explore programmes at Botswana institutions - in one place.
        </p>
        <p className="mt-2 max-w-md text-sm text-slate-300/95">
          Eligibility is indicative only; always confirm requirements with each university.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/predictor"
            className="focus-ring-on-dark inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-900 shadow-lg ring-1 ring-white/60 transition hover:bg-brand-50 hover:shadow-xl"
          >
            Check what you qualify for
          </Link>
          <Link
            to="/programmes"
            className="focus-ring-on-dark inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition hover:border-white/50 hover:bg-white/20"
          >
            Browse programmes
          </Link>
        </div>
      </div>
    </section>
  );
}
