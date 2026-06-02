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
    <section id="programmes" className="scroll-mt-24 py-14 sm:py-18" aria-labelledby="usecase-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal
          as="h2"
          id="usecase-heading"
          className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        >
          {content?.heading}
        </LandingReveal>
        <LandingReveal as="p" className="mt-3 max-w-2xl text-base text-slate-600" delay={80}>
          {content?.body}
        </LandingReveal>
        <ul className="mt-8 grid gap-5 sm:grid-cols-3">
          {programmes.map((programme, index) => (
            <LandingReveal as="li" key={programme.id} delay={index * 90}>
              <Link
                to={landingTo(isSignedIn, `/programmes/${programme.id}`, "#programmes")}
                className="landing-motion-card flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-300 hover:shadow-md"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">{programme.university}</span>
                <h3 className="mt-2 font-display text-base font-semibold leading-snug text-slate-900">{programme.name}</h3>
                {typeof programme.minPoints === "number" ? (
                  <p className="mt-3 text-sm text-slate-500">From {programme.minPoints} points in the directory</p>
                ) : null}
                <span className="mt-4 text-sm font-semibold text-brand-700">
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
