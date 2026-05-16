import { Link } from "react-router-dom";

/**
 * Hero imagery (Unsplash, real photo):
 * https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80
 */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80";

const HERO_STATS = [
  { value: "55+", label: "institutions" },
  { value: "Best six", label: "BGCSE scoring" },
  { value: "Shareable", label: "programme compare" },
];

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[min(86vh,42rem)] items-end overflow-hidden sm:min-h-[min(82vh,44rem)] sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900 bg-cover bg-[center_35%]"
        style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-900/35 sm:bg-[linear-gradient(90deg,rgba(6,18,18,0.94)_0%,rgba(8,26,27,0.82)_38%,rgba(8,26,27,0.42)_66%,rgba(8,26,27,0.18)_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--thuto-surface)] to-transparent"
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-200 sm:text-sm">Thuto · Botswana University Companion</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
          Know where your BGCSE points can take you
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-100/95 sm:text-lg">
          Check eligibility, explore local programmes, compare requirements, and keep your shortlist close before applications open.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9">
          <Link
            to="/login?next=/predictor"
            className="focus-ring-on-dark inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-900 shadow-lg ring-1 ring-white/60 transition hover:bg-brand-50 hover:shadow-xl"
          >
            Check eligibility
          </Link>
          <Link
            to="/login?next=/compare"
            className="focus-ring-on-dark inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition hover:border-white/55 hover:bg-white/20"
          >
            Compare programmes
          </Link>
        </div>
        <dl className="mt-10 grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
          {HERO_STATS.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/15 bg-slate-950/35 px-4 py-3 shadow-sm backdrop-blur-sm"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-100">{item.label}</dt>
              <dd className="mt-1 font-display text-xl font-semibold leading-none text-white">{item.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 max-w-xl text-sm leading-6 text-slate-200/90">
          Eligibility is indicative. Always confirm final requirements with each institution.
        </p>
      </div>
    </section>
  );
}
