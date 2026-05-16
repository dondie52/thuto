import { Link } from "react-router-dom";
import LandingReveal from "./LandingReveal.jsx";

const features = [
  {
    title: "Admission predictor",
    body: "Calculate your points and explore programmes that may match your results.",
    to: "/predictor",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: "Programme explorer",
    body: "Browse programmes, requirements, careers, and modules in one place.",
    to: "/programmes",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c1.052 0 2.062.18 3 .512V18.75m9-9v-1.5m-9 3v6.75m9-6.75v6.75m-9-3h18M15.75 15h-1.5m-1.5 0h1.5m-1.5 0v-6.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "University profiles",
    body: "Compare institutions, locations, and application timelines.",
    to: "/universities",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    title: "Course comparison",
    body: "Compare up to three programmes side by side.",
    to: "/compare",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <section className="border-y border-slate-100 bg-slate-50/50 py-14 sm:py-18" aria-labelledby="features-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal className="mb-12 max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Apply with more confidence
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Instead of opening multiple university websites and guessing where you qualify, use Thuto to build a clearer
            shortlist before applications open.
          </p>
        </LandingReveal>
        <LandingReveal
          as="h2"
          id="features-heading"
          className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          delay={80}
        >
          Built for Botswana applicants
        </LandingReveal>
        <LandingReveal as="p" className="mt-3 max-w-2xl text-base text-slate-600" delay={150}>
          Designed for students comparing universities and programmes across Botswana.
        </LandingReveal>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {features.map((f, index) => (
            <LandingReveal as="li" key={f.title} delay={index * 90}>
              <Link
                to={f.to}
                className="landing-motion-card group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-200 hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-100 text-brand-800 transition-colors group-hover:bg-brand-200">
                  {f.icon}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{f.body}</p>
                <span className="mt-4 text-sm font-semibold text-brand-700">Open in app →</span>
              </Link>
            </LandingReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
