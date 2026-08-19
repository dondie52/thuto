import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LandingReveal from "./LandingReveal.jsx";
import { landingTo, useLandingAuth } from "./LandingAuthContext.jsx";
import { fetchProgrammes } from "../../lib/programmesData.js";

const fallbackSamples = [
  { id: "ub-bsc-cs", name: "BSc Computer Science", university: "University of Botswana", minPoints: 42 },
  { id: "biust-bsc-data", name: "BSc Data Science", university: "BIUST", minPoints: 43 },
  { id: "bac-bcom-accounting", name: "BCom Accounting", university: "Botswana School of Business Sciences", minPoints: 38 },
];

export default function UseCaseShowcase({ content }) {
  const { isSignedIn } = useLandingAuth();
  const [programmes, setProgrammes] = useState(fallbackSamples);
  const selectedIds = useMemo(() => (Array.isArray(content?.programmeIds) ? content.programmeIds : []), [content?.programmeIds]);

  useEffect(() => {
    let cancelled = false;
    fetchProgrammes()
      .then((list) => {
        if (cancelled) return;
        const byId = new Map(list.map((programme) => [programme.id, programme]));
        const selected = selectedIds.map((id) => byId.get(id)).filter(Boolean);
        setProgrammes(selected.length ? selected.slice(0, 3) : fallbackSamples);
      })
      .catch(() => {
        if (!cancelled) setProgrammes(fallbackSamples);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedIds]);

  return (
    <section id="programmes" className="scroll-mt-24 bg-brand-950 py-16 sm:py-24" aria-labelledby="usecase-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Example programmes</p>
            <LandingReveal
              as="h2"
              id="usecase-heading"
              className="mt-3 max-w-[26ch] font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              {content?.heading}
            </LandingReveal>
          </div>
          <LandingReveal as="p" className="max-w-xs text-sm text-slate-300/80" delay={80}>
            {content?.body}
          </LandingReveal>
        </div>
        <ul className="mt-12 grid divide-y divide-white/10 border-y border-white/10 sm:mt-16 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {programmes.map((programme, index) => (
            <LandingReveal as="li" key={programme.id} delay={index * 90}>
              <Link
                to={landingTo(isSignedIn, `/programmes/${programme.id}`, "#programmes")}
                className="flex h-full flex-col justify-between p-8 sm:first:pl-0 sm:last:pr-0"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">{programme.university}</p>
                  <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-white">{programme.name}</h3>
                  {typeof programme.minPoints === "number" ? (
                    <p className="mt-4 text-xs text-slate-400">From {programme.minPoints} points in the directory</p>
                  ) : null}
                </div>
                <span className="mt-8 text-xs font-semibold text-amber-400">
                  {isSignedIn ? content?.signedInCta : content?.guestCta}
                </span>
              </Link>
            </LandingReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
