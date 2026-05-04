import { Link } from "react-router-dom";

const features = [
  {
    title: "Admission predictor",
    body: "Turn your BGCSE grades into points and see which programmes in the directory may line up with your profile.",
    to: "/predictor",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: "Programme explorer",
    body: "Filter by field and institution, open full programme pages, and see modules and careers side by side with requirements.",
    to: "/programmes",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c1.052 0 2.062.18 3 .512V18.75m9-9v-1.5m-9 3v6.75m9-6.75v6.75m-9-3h18M15.75 15h-1.5m-1.5 0h1.5m-1.5 0v-6.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "University profiles",
    body: "Skim where each institution is based, what it offers, and when applications tend to close - then jump to programmes.",
    to: "/universities",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    title: "Course comparison",
    body: "Pick up to three programmes and open a shareable comparison table for you, your family, or a counsellor.",
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
    <section className="border-y border-slate-100 bg-slate-50/50 py-16 sm:py-20" aria-labelledby="features-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="features-heading" className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Built for Botswana applicants
        </h2>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          Everything runs in the browser as a lightweight PWA - no accounts required to explore the sample directory.
        </p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <li key={f.title}>
              <Link
                to={f.to}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-200 hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-100 text-brand-800 transition group-hover:bg-brand-200">
                  {f.icon}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{f.body}</p>
                <span className="mt-4 text-sm font-semibold text-brand-700">Open in app →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
