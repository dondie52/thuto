export default function PartnersMission({ content }) {
  const stats = Array.isArray(content?.stats) ? content.stats : [];
  const highlight = content?.highlight || "";

  return (
    <section className="rounded-2xl bg-brand-900 px-5 py-10 text-center text-white sm:px-8 sm:py-12" aria-labelledby="partners-mission-heading">
      <h2 id="partners-mission-heading" className="font-display text-2xl font-bold sm:text-3xl">
        {content?.heading}
        {highlight ? (
          <>
            {": "}
            <span className="text-brand-200">{highlight}</span>
          </>
        ) : null}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-brand-50/90 sm:text-base">{content?.body}</p>
      {stats.length ? (
        <dl className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={`${stat.value}-${stat.label}`} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              <dt className="font-display text-2xl font-bold text-white">{stat.value}</dt>
              <dd className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-100">{stat.label}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
