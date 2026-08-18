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
        <div className="mt-12 grid divide-y divide-slate-200 border-y border-slate-200 sm:mt-16 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {items.map((text, index) => (
            <LandingReveal key={`${text}-${index}`} delay={index * 90} className="py-8 sm:px-8 sm:first:pl-0 sm:last:pr-0">
              <div className="text-xs font-semibold tracking-widest text-brand-700">0{index + 1}</div>
              <p className="mt-4 text-base leading-relaxed text-slate-600">{text}</p>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
