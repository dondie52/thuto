import LandingReveal from "./LandingReveal.jsx";

const icons = {
  home: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  ),
  regional: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  ),
  global: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a9 9 0 01-6.082-2.3M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
};

export default function StudentPathways({ content }) {
  const pathways = Array.isArray(content?.pathways) ? content.pathways : [];

  return (
    <section id="pathways" className="scroll-mt-24 border-b border-slate-100 bg-white py-14 sm:py-18" aria-labelledby="pathways-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal
          as="h2"
          id="pathways-heading"
          className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        >
          {content?.heading}
        </LandingReveal>
        <LandingReveal as="p" className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600" delay={80}>
          {content?.body}
        </LandingReveal>
        <ul className="mt-10 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {pathways.map((pathway, index) => (
            <LandingReveal as="li" key={`${pathway.title}-${index}`} delay={index * 110}>
              <article className="landing-motion-card flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm hover:border-brand-200 hover:shadow-md">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                  {icons[pathway.icon] || icons.home}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-slate-900">{pathway.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{pathway.body}</p>
              </article>
            </LandingReveal>
          ))}
        </ul>
        {content?.note ? (
          <LandingReveal as="p" className="mt-8 max-w-3xl text-sm leading-relaxed text-slate-500" delay={360}>
            {content.note}
          </LandingReveal>
        ) : null}
      </div>
    </section>
  );
}
