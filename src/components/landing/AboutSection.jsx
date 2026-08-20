import LandingReveal from "./LandingReveal.jsx";

const deviceShowcaseSrc = `${import.meta.env.BASE_URL}landing/thuto-devices.webp`;

export default function AboutSection({ content }) {
  const paragraphs = Array.isArray(content?.paragraphs) ? content.paragraphs : [];

  return (
    <section id="about" className="scroll-mt-24 border-t border-slate-200 bg-[var(--thuto-surface-elevated)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <LandingReveal className="mx-auto w-full max-w-[520px]">
            <img
              src={deviceShowcaseSrc}
              alt="Thuto on a phone, laptop, and tablet showing a programme page, the landing page, and the university directory."
              width={724}
              height={508}
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
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
