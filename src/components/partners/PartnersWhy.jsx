import { partnerIcons } from "./partnerIcons.jsx";

export default function PartnersWhy({ content }) {
  const items = Array.isArray(content?.items) ? content.items : [];

  return (
    <section aria-labelledby="partners-why-heading">
      <h2 id="partners-why-heading" className="font-display text-2xl font-bold text-brand-950 sm:text-3xl">
        {content?.heading}
      </h2>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {items.map((item, index) => (
          <li
            key={`${item.title}-${index}`}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-brand-50 bg-gradient-to-br from-brand-50 to-white px-5 py-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-white">
                {partnerIcons[item.icon] || partnerIcons.verified}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold text-brand-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
