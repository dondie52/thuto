import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const storySteps = [
  {
    eyebrow: "01 / Eligibility",
    title: "Start with the grades in your hands.",
    body: "Enter BGCSE subjects once and Thuto turns them into a clear, indicative points profile.",
    stat: "45 pts",
    accent: "bg-[#ffd166]",
  },
  {
    eyebrow: "02 / Matches",
    title: "Find programmes that are actually within reach.",
    body: "Scan matching courses, near misses, subject requirements, and the institutions behind each option.",
    stat: "300+ paths",
    accent: "bg-[#5eead4]",
  },
  {
    eyebrow: "03 / Compare",
    title: "Put the serious choices side by side.",
    body: "Compare minimum points, requirements, duration, and application links before your shortlist gets messy.",
    stat: "3 at once",
    accent: "bg-[#ff6b5f]",
  },
  {
    eyebrow: "04 / Shortlist",
    title: "Move from guessing to applying with intent.",
    body: "Browse Botswana institutions, save strong options, and know what to confirm with admissions offices.",
    stat: "55 schools",
    accent: "bg-[#a7f3d0]",
  },
];

const featureLinks = [
  { to: "/login?next=/predictor", label: "Check eligibility" },
  { to: "/programmes", label: "Browse programmes" },
  { to: "/universities", label: "View universities" },
];

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

export default function ScrollStory() {
  const sectionRef = useRef(null);
  const visualRef = useRef(null);
  const progressRef = useRef(null);
  const videoRef = useRef(null);
  const stepRefs = useRef([]);
  const [activeStep, setActiveStep] = useState(0);

  const videoSrc = useMemo(() => assetUrl("landing/thuto-scroll-story.mp4"), []);
  const posterSrc = useMemo(() => assetUrl("landing/thuto-scroll-story-poster.svg"), []);

  useEffect(() => {
    const section = sectionRef.current;
    const visual = visualRef.current;
    const progressBar = progressRef.current;
    const video = videoRef.current;
    const stepElements = stepRefs.current.filter(Boolean);
    if (!section || !visual || !progressBar || !stepElements.length) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      gsap.set(stepElements, { autoAlpha: 0.42, y: 18 });
      gsap.set(stepElements[0], { autoAlpha: 1, y: 0 });

      stepElements.forEach((step, index) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top 64%",
          end: "bottom 42%",
          onEnter: () => setActiveStep(index),
          onEnterBack: () => setActiveStep(index),
        });
      });

      if (reduceMotion) {
        gsap.set(stepElements, { autoAlpha: 1, y: 0 });
        gsap.set(progressBar, { scaleX: 1 });
        return;
      }

      gsap.to(stepElements, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: section,
          start: "top 70%",
          once: true,
        },
      });

      ScrollTrigger.matchMedia({
        "(min-width: 1024px)": () => {
          const scrub = ScrollTrigger.create({
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            pin: visual,
            pinSpacing: false,
            scrub: true,
            onUpdate: (self) => {
              gsap.set(progressBar, { scaleX: self.progress });
              if (video?.duration && Number.isFinite(video.duration)) {
                video.currentTime = Math.min(video.duration - 0.05, self.progress * video.duration);
              }
            },
          });

          return () => scrub.kill();
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const stepElements = stepRefs.current.filter(Boolean);
    stepElements.forEach((step, index) => {
      gsap.to(step, {
        autoAlpha: index === activeStep ? 1 : 0.48,
        scale: index === activeStep ? 1 : 0.985,
        duration: 0.28,
        ease: "power2.out",
      });
    });
  }, [activeStep]);

  return (
    <section ref={sectionRef} className="relative isolate overflow-hidden bg-[#111827] text-white">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(118deg,#0f172a_0%,#16213f_46%,#115e59_100%)]" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.17] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:44px_44px]"
        aria-hidden
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:min-h-[430vh] lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:pb-28">
        <div className="lg:pt-[12vh]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#ffd166] sm:text-sm">Thuto · BUC</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.02] text-white sm:text-5xl lg:text-6xl">
            Find the courses you actually qualify for.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
            A scroll-guided preview of how Thuto turns BGCSE results into programme matches, comparisons, and a focused
            university shortlist.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/login?next=/predictor"
              className="focus-ring-on-dark inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0f172a] shadow-xl transition hover:bg-[#fff7df]"
            >
              Check eligibility
            </Link>
            <Link
              to="/programmes"
              className="focus-ring-on-dark inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/18"
            >
              Browse programmes
            </Link>
          </div>

          <div className="mt-14 space-y-7 lg:mt-[42vh] lg:space-y-[34vh]">
            {storySteps.map((step, index) => (
              <article
                key={step.title}
                ref={(node) => {
                  stepRefs.current[index] = node;
                }}
                className="story-step rounded-[1.75rem] border border-white/14 bg-white/[0.08] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ffd166]">{step.eyebrow}</p>
                    <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
                      {step.title}
                    </h2>
                  </div>
                  <span
                    className={[
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#111827]",
                      step.accent,
                    ].join(" ")}
                  >
                    {step.stat}
                  </span>
                </div>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">{step.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div ref={visualRef} className="self-start lg:top-0 lg:flex lg:h-dvh lg:items-center">
          <div className="relative w-full">
            <div className="overflow-hidden rounded-[2rem] border border-white/18 bg-[#0f172a] shadow-[0_34px_110px_rgba(0,0,0,0.38)]">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff6b5f]" />
                  <span className="h-3 w-3 rounded-full bg-[#ffd166]" />
                  <span className="h-3 w-3 rounded-full bg-[#5eead4]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Live journey</span>
              </div>
              <video
                ref={videoRef}
                className="aspect-video w-full bg-[#111827] object-cover"
                muted
                playsInline
                preload="metadata"
                poster={posterSrc}
                aria-label="Animated preview of Thuto's eligibility and programme comparison journey"
              >
                <source src={videoSrc} type="video/mp4" />
              </video>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
              <div ref={progressRef} className="h-full origin-left scale-x-0 rounded-full bg-[#ffd166]" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {featureLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="focus-ring-on-dark rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/[0.14]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-300">
              Eligibility is indicative only. Always confirm final requirements with the institution.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
