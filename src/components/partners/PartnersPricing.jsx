import { PARTNER_TIERS, PARTNER_TIER_FEATURES } from "../../lib/partnerTiers.js";

function tierCell(value) {
  if (value === true) return <span className="font-semibold text-brand-800">Yes</span>;
  return <span className="text-slate-400">-</span>;
}

export default function PartnersPricing({ content, onBookDemo }) {
  function handleBookDemo(event) {
    event.preventDefault();
    onBookDemo?.();
  }

  return (
    <section className="space-y-6" aria-labelledby="partners-pricing-heading">
      <div>
        <h2 id="partners-pricing-heading" className="font-display text-2xl font-bold text-brand-950 sm:text-3xl">
          {content?.heading}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{content?.body}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PARTNER_TIERS.map((tier) => (
          <article
            key={tier.id}
            className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm ${
              tier.highlighted ? "border-brand-500 ring-2 ring-brand-200" : "border-brand-100"
            }`}
          >
            {tier.highlighted ? (
              <span className="mb-2 w-fit rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                Popular
              </span>
            ) : null}
            <h3 className="font-display text-lg font-semibold text-brand-900">{tier.name}</h3>
            <p className="mt-1 text-sm font-semibold text-brand-700">{tier.priceLabel}</p>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{tier.description}</p>
            <a
              href="#partner-inquiry"
              onClick={handleBookDemo}
              className={`focus-ring mt-4 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold ${
                tier.highlighted
                  ? "bg-brand-700 text-white hover:bg-brand-800"
                  : "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
              }`}
            >
              {content?.ctaLabel || "Talk to our team"}
            </a>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-brand-900">{content?.comparisonHeading}</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3 font-semibold">Feature</th>
                {PARTNER_TIERS.map((tier) => (
                  <th key={tier.id} className="py-2 pr-3 font-semibold">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PARTNER_TIER_FEATURES.map((row) => (
                <tr key={row.feature} className="border-b border-brand-50 align-top">
                  <th className="py-2.5 pr-3 font-medium text-brand-900">{row.feature}</th>
                  <td className="py-2.5 pr-3">{tierCell(row.verified)}</td>
                  <td className="py-2.5 pr-3">{tierCell(row.insights)}</td>
                  <td className="py-2.5 pr-3">{tierCell(row.spotlight)}</td>
                  <td className="py-2.5 pr-3">{tierCell(row.growth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
