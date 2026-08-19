import LandingReveal from "./LandingReveal.jsx";

export default function AboutSection({ content }) {
  const paragraphs = Array.isArray(content?.paragraphs) ? content.paragraphs : [];

  return (
    <section id="about" className="scroll-mt-24 border-t border-slate-200 bg-[var(--thuto-surface-elevated)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <LandingReveal className="mx-auto w-full max-w-[220px]">
            <div className="rounded-[2.25rem] border-[6px] border-slate-900 bg-slate-900 p-2 shadow-xl">
              <div className="overflow-hidden rounded-[1.75rem] bg-white">
                <div className="bg-brand-700 px-3 pb-3 pt-2">
                  <div className="mx-auto h-1 w-10 rounded-full bg-white/30" aria-hidden />
                  <p className="mt-2 text-[10px] font-semibold text-white">Thuto</p>
                </div>
                <div className="space-y-2 p-3">
                  <p className="font-display text-xs font-bold text-slate-900">BA Economics</p>
                  <p className="text-[9px] text-slate-500">University of Botswana · Humanities</p>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[8px]">
                      <span className="text-slate-400">Duration</span>
                      <span className="font-semibold text-slate-700">4 years</span>
                    </div>
                    <div className="flex items-center justify-between text-[8px]">
                      <span className="text-slate-400">Minimum points</span>
                      <span className="font-semibold text-slate-700">34</span>
                    </div>
                    <div className="flex items-center justify-between text-[8px]">
                      <span className="text-slate-400">Campus</span>
                      <span className="font-semibold text-slate-700">Gaborone</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </LandingReveal>

          <div>
            <LandingReveal as="h2" className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl" delay={80}>
              {content?.heading}
            </LandingReveal>
            <LandingReveal className="mt-6 max-w-[70ch] space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base" delay={150}>
              {paragraphs.map((paragraph, index) => (
                <p key={`${paragraph}-${index}`}>{paragraph}</p>
              ))}
            </LandingReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
