import LandingReveal from "./LandingReveal.jsx";

export default function AboutSection({ content }) {
  const paragraphs = Array.isArray(content?.paragraphs) ? content.paragraphs : [];

  return (
    <section id="about" className="scroll-mt-24 border-t border-slate-100 bg-slate-50/60 py-12 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal as="h2" className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
          {content?.heading}
        </LandingReveal>
        <LandingReveal className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base" delay={80}>
          {paragraphs.map((paragraph, index) => (
            <p key={`${paragraph}-${index}`}>{paragraph}</p>
          ))}
        </LandingReveal>
      </div>
    </section>
  );
}
