import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";

const featuredLogos = [
  { id: "ub", short: "UB", name: "University of Botswana", src: "university-logos/ub.jpg" },
  { id: "biust", short: "BIUST", name: "BIUST", src: "university-logos/biust.jpg" },
  { id: "buan", short: "BUAN", name: "Botswana University of Agriculture and Natural Resources", src: "university-logos/buan.jpg" },
  { id: "botho", short: "Botho", name: "Botho University", src: "university-logos/botho.jpg" },
  { id: "ba-isago", short: "BA ISAGO", name: "BA ISAGO University", src: "university-logos/ba-isago.jpg" },
  { id: "bou", short: "BOU", name: "Botswana Open University", src: "university-logos/bou.jpg" },
  { id: "limkokwing", short: "Limkokwing", name: "Limkokwing University", src: "university-logos/limkokwing.jpg" },
  { id: "bac", short: "BSBS", name: "Botswana School of Business Sciences", src: "university-logos/bac.jpg" },
  { id: "fctve", short: "FCTVE", name: "Francistown College of Technical and Vocational Education", src: "university-logos/fctve.jpg" },
  { id: "boitekanelo", short: "Boitekanelo", name: "Boitekanelo College", src: "university-logos/boitekanelo.jpg" },
  { id: "abm", short: "ABM", name: "ABM University College", src: "university-logos/abm.jpg" },
  { id: "new-era", short: "New Era", name: "New Era College", src: "university-logos/new-era.jpg" },
  { id: "naledi-training-institute", short: "NTI", name: "Naledi Training Institute", src: "university-logos/naledi.jpg" },
];

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

export default function UniversitiesSection() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const marqueeTweenRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const visibleLogos = useMemo(
    () => (reducedMotion ? featuredLogos : [...featuredLogos, ...featuredLogos]),
    [reducedMotion],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReducedMotion(media.matches);
    syncMotionPreference();
    media.addEventListener?.("change", syncMotionPreference);
    return () => media.removeEventListener?.("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return undefined;

    const ctx = gsap.context(() => {
      gsap.set(".logo-showcase-copy", { autoAlpha: 0, y: 18 });
      gsap.set(".logo-card", { autoAlpha: 0, y: 22, scale: 0.96 });

      const reveal = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
      reveal
        .to(".logo-showcase-copy", { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 })
        .to(".logo-card", { autoAlpha: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.045 }, "-=0.34");

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            reveal.play();
            observer.disconnect();
          }
        },
        { threshold: 0.25 },
      );
      observer.observe(section);

      if (!reducedMotion) {
        marqueeTweenRef.current = gsap.to(track, {
          xPercent: -50,
          duration: 34,
          ease: "none",
          repeat: -1,
        });
      }

      return () => observer.disconnect();
    }, section);

    return () => {
      marqueeTweenRef.current = null;
      ctx.revert();
    };
  }, [reducedMotion]);

  function pauseMarquee() {
    marqueeTweenRef.current?.pause();
  }

  function resumeMarquee() {
    marqueeTweenRef.current?.resume();
  }

  function liftLogo(event) {
    pauseMarquee();
    gsap.to(event.currentTarget, { y: -6, scale: 1.03, duration: 0.24, ease: "power2.out" });
  }

  function settleLogo(event) {
    gsap.to(event.currentTarget, { y: 0, scale: 1, duration: 0.24, ease: "power2.out" });
    resumeMarquee();
  }

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden border-t border-emerald-950/10 bg-[#f8f5ee] py-14 sm:py-18"
      aria-labelledby="unis-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <p className="logo-showcase-copy text-xs font-bold uppercase tracking-[0.22em] text-brand-700">
              University directory
            </p>
            <h2
              id="unis-heading"
              className="logo-showcase-copy mt-3 max-w-xl font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
            >
              Compare institutions across Botswana.
            </h2>
            <p className="logo-showcase-copy mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              Browse universities and training institutions, then jump straight into their programmes.
            </p>
          </div>

          <div className="logo-showcase-copy flex flex-col gap-3 rounded-xl border border-white/80 bg-white/65 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Featured</span>
              <span className="rounded-full bg-brand-700 px-3 py-1 text-xs font-bold text-white">
                {featuredLogos.length} logos
              </span>
            </div>
            <ul className="grid grid-cols-2 gap-3 py-2 sm:hidden" aria-label="Featured institution logos">
              {featuredLogos.slice(0, 6).map((u) => (
                <li key={u.id}>
                  <Link
                    to={`/universities/${u.id}`}
                    className="logo-card flex h-24 min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm outline-none transition-colors hover:border-brand-300 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-200"
                    onMouseEnter={liftLogo}
                    onMouseLeave={settleLogo}
                    onFocus={liftLogo}
                    onBlur={settleLogo}
                  >
                    <span className="flex min-h-0 flex-1 items-center justify-center">
                      <img
                        src={assetUrl(u.src)}
                        alt={`${u.name} logo`}
                        className="max-h-12 max-w-[6.5rem] object-contain"
                        loading="lazy"
                      />
                    </span>
                    <span className="mt-2 block truncate text-center text-[11px] font-bold text-slate-700">
                      {u.short}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="relative -mx-4 hidden overflow-hidden px-4 sm:-mx-5 sm:block sm:px-5">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white/95 to-transparent sm:w-20"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white/95 to-transparent sm:w-20"
                aria-hidden
              />
              <ul
                ref={trackRef}
                className={[
                  "flex gap-3 py-2",
                  reducedMotion ? "flex-wrap justify-center" : "w-max",
                ].join(" ")}
                aria-label="Featured institution logos"
              >
                {visibleLogos.map((u, index) => {
                  const duplicateLogo = !reducedMotion && index >= featuredLogos.length;
                  return (
                    <li key={`${u.id}-${index}`} aria-hidden={duplicateLogo}>
                      <Link
                        to={`/universities/${u.id}`}
                        className="logo-card group flex h-28 w-40 shrink-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm outline-none transition-colors hover:border-brand-300 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-200"
                        tabIndex={duplicateLogo ? -1 : undefined}
                        aria-hidden={duplicateLogo}
                        onMouseEnter={liftLogo}
                        onMouseLeave={settleLogo}
                        onFocus={liftLogo}
                        onBlur={settleLogo}
                      >
                        <span className="flex min-h-0 flex-1 items-center justify-center">
                          <img
                            src={assetUrl(u.src)}
                            alt={duplicateLogo ? "" : `${u.name} logo`}
                            className="max-h-14 max-w-[7.75rem] object-contain"
                            loading="lazy"
                          />
                        </span>
                        <span className="mt-2 block truncate text-center text-[11px] font-bold text-slate-700">
                          {u.short}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="logo-showcase-copy mt-8 flex flex-wrap items-center gap-4">
          <Link
            to="/universities"
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-800"
          >
            View all universities
          </Link>
          <span className="text-sm text-slate-500">Profiles include locations, programmes, and application timing.</span>
        </div>
      </div>
    </section>
  );
}
