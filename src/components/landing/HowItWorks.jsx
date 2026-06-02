import LandingReveal from "./LandingReveal.jsx";

const icons = {
  results: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  ),
  chart: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h16.5m0 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0h-9.5M9 11.25v1.5M12 9v3.75m3-6v6" />
    </svg>
  ),
  compare: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  ),
};

export default function HowItWorks({ content }) {
  const steps = Array.isArray(content?.steps) ? content.steps : [];

  return (
    <section className="py-14 sm:py-18" aria-labelledby="how-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal
          as="h2"
          id="how-heading"
          className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        >
          {content?.heading}
        </LandingReveal>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3 lg:gap-8">
          {steps.map((step, index) => (
            <LandingReveal as="li" key={`${step.title}-${index}`} delay={index * 110}>
              <article className="landing-motion-card flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                    {icons[step.icon] || icons.results}
                  </span>
                  <span className="font-display text-sm font-semibold text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </article>
            </LandingReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
