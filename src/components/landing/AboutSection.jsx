import LandingReveal from "./LandingReveal.jsx";

export default function AboutSection({ content }) {
  const paragraphs = Array.isArray(content?.paragraphs) ? content.paragraphs : [];
  const midpoint = Math.ceil(paragraphs.length / 2);
  const columns = [paragraphs.slice(0, midpoint), paragraphs.slice(midpoint)].filter((column) => column.length);

  return (
    <section id="about" className="scroll-mt-24 border-t border-slate-200 bg-[var(--thuto-surface-elevated)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal as="h2" className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {content?.heading}
        </LandingReveal>
        <div className="mt-8 grid gap-x-8 gap-y-4 text-sm leading-relaxed text-slate-600 sm:text-base md:grid-cols-2">
          {columns.map((column, columnIndex) => (
            <LandingReveal key={columnIndex} className="space-y-4" delay={80 + columnIndex * 90}>
              {column.map((paragraph, index) => (
                <p key={`${paragraph}-${index}`}>{paragraph}</p>
              ))}
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
