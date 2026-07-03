import { partnerIcons } from "./partnerIcons.jsx";

export default function PartnersWho({ content }) {
  const items = Array.isArray(content?.items) ? content.items : [];

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6" aria-labelledby="partners-who-heading">
      <h2 id="partners-who-heading" className="text-center font-display text-2xl font-bold text-brand-800 sm:text-3xl">
        {content?.heading}
      </h2>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <li key={`${item.title}-${index}`} className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
              {partnerIcons[item.icon] || partnerIcons.university}
            </span>
            <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
