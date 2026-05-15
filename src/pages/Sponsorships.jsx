import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const fundingRoutes = [
  {
    title: "Government sponsorship",
    body: "Track public sponsorship windows, required documents, and application timing alongside university deadlines.",
  },
  {
    title: "Institution scholarships",
    body: "Keep an eye on university-funded awards, merit support, and programme-specific funding notices.",
  },
  {
    title: "Private and employer support",
    body: "Plan for bursaries, workplace support, and sector-linked funding where a programme connects to a sponsor.",
  },
];

export default function Sponsorships() {
  useDocumentTitle("Sponsorships | Thuto");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Sponsorships</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-900">Funding routes</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          A first home for sponsorship notes, deadlines, and funding paths linked to Botswana study options.
        </p>
      </div>

      <section className="space-y-3">
        {fundingRoutes.map((route) => (
          <article key={route.title} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-brand-900">{route.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{route.body}</p>
          </article>
        ))}
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-stone-900">Coming into focus</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-700">
          Sponsorship listings should be verified against official funder notices before a student acts on them.
        </p>
        <Link to="/universities" className="mt-3 inline-flex text-sm font-semibold text-brand-800 underline">
          Check university profiles
        </Link>
      </div>
    </div>
  );
}
