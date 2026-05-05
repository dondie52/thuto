import { Link } from "react-router-dom";

/** Example programmes (min points ≤ 44 on the official BGCSE A=8 scale) - matches public/data/programmes.json ids */
const samples = [
  { id: "ub-bsc-cs", name: "BSc Computer Science", university: "University of Botswana", minPoints: 42 },
  { id: "biust-bsc-data", name: "BSc Data Science", university: "BIUST", minPoints: 43 },
  { id: "bac-bcom-accounting", name: "BCom Accounting", university: "Botswana School of Business Sciences", minPoints: 38 },
];

export default function UseCaseShowcase() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="usecase-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="usecase-heading" className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          See what you can study today
        </h2>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          With <strong className="font-semibold text-slate-800">44 points</strong>, you may qualify for programmes like these
          in the Thuto sample directory - subject rules still apply, so open each page for the full picture.
        </p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-3">
          {samples.map((p) => (
            <li key={p.id}>
              <Link
                to={`/programmes/${p.id}`}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">{p.university}</span>
                <h3 className="mt-2 font-display text-base font-semibold leading-snug text-slate-900">{p.name}</h3>
                <p className="mt-3 text-sm text-slate-500">From {p.minPoints} points in the directory</p>
                <span className="mt-4 text-sm font-semibold text-brand-700">View programme →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
