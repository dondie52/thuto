import LandingReveal from "./LandingReveal.jsx";

export default function ProblemSection({ content }) {
  const items = Array.isArray(content?.items) ? content.items : [];

  return (
    <section className="bg-[var(--thuto-surface)] py-16 sm:py-24" aria-labelledby="problem-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal
          as="h2"
          id="problem-heading"
          className="max-w-[18ch] font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
        >
          {content?.heading}
        </LandingReveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:mt-16 sm:grid-cols-3">
          {items.map((text, index) => (
            <LandingReveal as="div" key={`${text}-${index}`} delay={index * 90} className="bg-white p-8">
              <div className="text-xs font-semibold tracking-widest text-brand-700">0{index + 1}</div>
              <p className="mt-4 text-base leading-relaxed text-slate-600">{text}</p>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
