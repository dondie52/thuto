import LandingReveal from "./LandingReveal.jsx";

export default function HowItWorks({ content }) {
  const steps = Array.isArray(content?.steps) ? content.steps : [];

  return (
    <section id="how-it-works" className="scroll-mt-24 bg-[var(--thuto-surface-elevated)] py-16 sm:py-24" aria-labelledby="how-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-baseline gap-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Process</span>
          <LandingReveal as="h2" id="how-heading" className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {content?.heading}
          </LandingReveal>
        </div>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:mt-16 sm:grid-cols-3">
          {steps.map((step, index) => (
            <LandingReveal as="li" key={`${step.title}-${index}`} delay={index * 110} className="bg-white p-8 sm:p-10">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 font-display text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-7 font-display text-xl font-semibold leading-snug text-slate-900">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{step.body}</p>
            </LandingReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
