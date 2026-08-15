import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import UniversityInitialsBadge from "../UniversityInitialsBadge.jsx";
import { fetchUniversities } from "../../lib/universitiesData.js";
import { deriveUniversityInitials } from "../../lib/universityBranding.js";
import { landingTo, useLandingAuth } from "./LandingAuthContext.jsx";

// Spread across the live markets rather than Botswana only — the catalogue now covers seven
// countries, and a Botswana-only strip misrepresents it to a first-time visitor.
const DEFAULT_FEATURED_IDS = [
  "ub",
  "biust",
  "buan",
  "botho",
  "bou",
  "uct",
  "wits",
  "up",
  "stellenbosch",
  "ukzn",
  "university-of-zambia",
  "international-university-of-management",
];

export default function UniversitiesSection({ content }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const marqueeTweenRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [universitiesById, setUniversitiesById] = useState(new Map());
  const [catalogueSize, setCatalogueSize] = useState(0);
  const { isSignedIn } = useLandingAuth();

  useEffect(() => {
    let cancelled = false;
    // The landing strip advertises the whole catalogue, so it is never scoped to one market.
    fetchUniversities({ includeAllCountries: true })
      .then(({ list }) => {
        if (cancelled) return;
        setUniversitiesById(new Map(list.map((u) => [u.id, u])));
        setCatalogueSize(list.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredInstitutions = useMemo(() => {
    const ids = Array.isArray(content?.featuredUniversityIds) ? content.featuredUniversityIds : DEFAULT_FEATURED_IDS;
    // Drop ids with no matching record instead of rendering the raw slug as a name — a
    // CMS-supplied list can point at institutions that no longer exist.
    return ids.map((id) => universitiesById.get(id)).filter(Boolean);
  }, [content?.featuredUniversityIds, universitiesById]);

  const visibleInstitutions = useMemo(
    () => (reducedMotion ? featuredInstitutions : [...featuredInstitutions, ...featuredInstitutions]),
    [featuredInstitutions, reducedMotion],
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
      if (reducedMotion) {
        gsap.set(".logo-showcase-copy, .logo-card", { autoAlpha: 1, clearProps: "transform" });
        return undefined;
      }

      gsap.set(".logo-showcase-copy", { autoAlpha: 0, y: 18 });
      gsap.set(".logo-card", { autoAlpha: 0, y: 22, scale: 0.96 });

      const reveal = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
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

      marqueeTweenRef.current = gsap.to(track, {
        xPercent: -50,
        duration: 34,
        ease: "none",
        repeat: -1,
      });

      return () => observer.disconnect();
    }, section);

    return () => {
      marqueeTweenRef.current = null;
      ctx.revert();
    };
  }, [reducedMotion, featuredInstitutions]);

  function pauseMarquee() {
    marqueeTweenRef.current?.pause();
  }

  function resumeMarquee() {
    marqueeTweenRef.current?.resume();
  }

  function liftCard(event) {
    if (reducedMotion) return;
    pauseMarquee();
    gsap.to(event.currentTarget, { y: -6, scale: 1.03, duration: 0.24, ease: "expo.out" });
  }

  function settleCard(event) {
    if (reducedMotion) return;
    gsap.to(event.currentTarget, { y: 0, scale: 1, duration: 0.24, ease: "expo.out" });
    resumeMarquee();
  }

  function institutionLabel(university) {
    return university.name || deriveUniversityInitials(university);
  }

  return (
    <section
      id="universities"
      ref={sectionRef}
      className="scroll-mt-24 overflow-hidden border-t border-emerald-950/10 bg-[#f8f5ee] py-14 sm:py-18"
      aria-labelledby="unis-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <p className="logo-showcase-copy text-xs font-bold uppercase tracking-[0.22em] text-brand-700">
              {content?.kicker}
            </p>
            <h2
              id="unis-heading"
              className="logo-showcase-copy mt-3 max-w-xl font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
            >
              {content?.heading}
            </h2>
            <p className="logo-showcase-copy mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              {content?.body}
            </p>
          </div>

          <div className="logo-showcase-copy flex flex-col gap-3 rounded-xl border border-white/80 bg-white/65 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{content?.featuredLabel}</span>
              <span className="rounded-full bg-brand-700 px-3 py-1 text-xs font-bold text-white">
                {catalogueSize ? `${catalogueSize}+ ${content?.badgeSuffix}` : content?.badgeSuffix}
              </span>
            </div>
            <ul className="grid grid-cols-2 gap-3 py-2 sm:hidden" aria-label="Featured institutions">
              {featuredInstitutions.slice(0, 6).map((u) => (
                <li key={u.id}>
                  <Link
                    to={landingTo(isSignedIn, `/universities/${u.id}`, "#universities")}
                    className="logo-card flex h-32 min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm outline-none transition-colors hover:border-brand-300 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-200"
                    onMouseEnter={liftCard}
                    onMouseLeave={settleCard}
                    onFocus={liftCard}
                    onBlur={settleCard}
                  >
                    <span className="flex flex-1 items-center justify-center">
                      <UniversityInitialsBadge university={u} size="md" />
                    </span>
                    <span className="mt-2 line-clamp-2 block text-center text-[11px] font-semibold leading-tight text-slate-700">
                      {institutionLabel(u)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="relative -mx-4 hidden overflow-hidden px-4 sm:-mx-5 sm:block sm:px-5">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white/95 to-transparent sm:w-20" aria-hidden />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white/95 to-transparent sm:w-20" aria-hidden />
              <ul
                ref={trackRef}
                className={["flex gap-3 py-2", reducedMotion ? "flex-wrap justify-center" : "w-max"].join(" ")}
                aria-label="Featured institutions"
              >
                {visibleInstitutions.map((u, index) => {
                  const duplicate = !reducedMotion && index >= featuredInstitutions.length;
                  return (
                    <li key={`${u.id}-${index}`} aria-hidden={duplicate}>
                      <Link
                        to={landingTo(isSignedIn, `/universities/${u.id}`, "#universities")}
                        className="logo-card group flex h-36 w-52 shrink-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm outline-none transition-colors hover:border-brand-300 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-200"
                        tabIndex={duplicate ? -1 : undefined}
                        aria-hidden={duplicate}
                        onMouseEnter={liftCard}
                        onMouseLeave={settleCard}
                        onFocus={liftCard}
                        onBlur={settleCard}
                      >
                        <span className="flex flex-1 items-center justify-center">
                          <UniversityInitialsBadge university={u} size="lg" />
                        </span>
                        <span className="mt-2 line-clamp-2 block text-center text-[11px] font-semibold leading-tight text-slate-700">
                          {institutionLabel(u)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="logo-showcase-copy mt-8 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to={landingTo(isSignedIn, "/universities", "#universities")}
              className="focus-ring landing-motion-press inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-800"
            >
              {isSignedIn ? content?.ctaSignedIn : content?.ctaGuest}
            </Link>
            <span className="text-sm text-slate-500">{content?.note}</span>
          </div>
          {content?.affiliationNote ? (
            <p className="max-w-3xl text-xs leading-relaxed text-slate-500">{content.affiliationNote}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
