import { Link } from "react-router-dom";

const institutions = [
  { short: "UB", name: "University of Botswana" },
  { short: "BIUST", name: "Botswana International University of Science and Technology" },
  { short: "BAC", name: "Botswana School of Business Sciences" },
];

export default function UniversitiesSection() {
  return (
    <section className="border-t border-slate-100 bg-white py-16 sm:py-20" aria-labelledby="unis-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="unis-heading" className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Institutions in the directory
        </h2>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          Explore programmes across Botswana&apos;s top institutions - starting with UB, BIUST, and BSBS (BAC) in the sample data.
        </p>
        <ul className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-6">
          {institutions.map((u) => (
            <li key={u.short} className="flex-1 sm:min-w-[200px] sm:flex-initial">
              <div className="flex h-full items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-white font-display text-sm font-bold text-brand-800">
                  {u.short}
                </span>
                <span className="text-sm font-medium leading-snug text-slate-800">{u.name}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Link
            to="/universities"
            className="inline-flex text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 hover:text-brand-900"
          >
            View all universities
          </Link>
        </div>
      </div>
    </section>
  );
}
