const problems = [
  "Many students are unsure which programmes their BGCSE points qualify for.",
  "Comparing requirements across universities takes too much time.",
  "Career paths and course details are often difficult to find before applying.",
];

export default function ProblemSection() {
  return (
    <section className="border-b border-slate-100 bg-slate-50/80 py-14 sm:py-18" aria-labelledby="problem-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="problem-heading" className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Choosing a course shouldn&apos;t be guesswork
        </h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {problems.map((text) => (
            <li key={text} className="relative pl-0 sm:pl-0">
              <span
                className="mb-3 block h-1 w-10 rounded-full bg-brand-500"
                aria-hidden
              />
              <p className="text-base leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
