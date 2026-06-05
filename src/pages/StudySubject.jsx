import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { fetchProgrammes } from "../lib/programmesData.js";
import { fetchStudy, getStudySubject, programmesForRequirementKey } from "../lib/studyData.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

function IconExternal({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7M10 14L21 3M21 14v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6" />
    </svg>
  );
}

const RESOURCE_TYPE_LABELS = {
  simulation: "Simulation",
  textbook: "Textbook",
  practice: "Practice",
};

export default function StudySubject() {
  const { subjectId } = useParams();
  const [catalog, setCatalog] = useState(null);
  const [programmes, setProgrammes] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const subject = useMemo(() => (catalog ? getStudySubject(catalog, subjectId) : null), [catalog, subjectId]);

  useDocumentTitle(subject ? `${subject.label} | BGCSE Study | Thuto` : "BGCSE Study | Thuto");

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    Promise.all([fetchStudy({ signal: ac.signal }), fetchProgrammes({ signal: ac.signal })])
      .then(([studyData, programmeData]) => {
        if (!cancelled) {
          setCatalog(studyData);
          setProgrammes(programmeData);
        }
      })
      .catch((err) => {
        if (!cancelled && err.name !== "AbortError") setLoadError("Could not load this subject. Try again later.");
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const relatedProgrammes = useMemo(() => {
    if (!subject?.requirementKey) return [];
    return programmesForRequirementKey(programmes, subject.requirementKey)
      .filter((p) => typeof p.minPoints === "number")
      .sort((a, b) => (a.minPoints ?? 0) - (b.minPoints ?? 0))
      .slice(0, 12);
  }, [programmes, subject]);

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link to="/study" className="text-sm font-semibold text-brand-800 underline">
          ← Back to Study
        </Link>
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {loadError}
        </p>
      </div>
    );
  }

  if (!catalog) {
    return (
      <p className="text-sm text-slate-500" role="status">
        Loading…
      </p>
    );
  }

  if (!subject) {
    return (
      <div className="space-y-4">
        <Link to="/study" className="text-sm font-semibold text-brand-800 underline">
          ← Back to Study
        </Link>
        <h1 className="font-display text-2xl font-bold text-brand-900">Subject not found</h1>
        <p className="text-sm text-slate-600">That subject is not in the Thuto study directory yet.</p>
      </div>
    );
  }

  const lpUrl = safeExternalUrl(subject.learningPassport?.url);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/study" className="text-sm font-semibold text-brand-800 underline">
          ← Back to Study
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold text-brand-900">{subject.label}</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          BGCSE revision links and university-planning context. Thuto does not host curriculum content — open Learning Passport for official lessons and past papers.
        </p>
      </div>

      {lpUrl ? (
        <section
          className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm"
          aria-labelledby="lp-resource-heading"
        >
          <div className="border-b border-brand-100 bg-gradient-to-r from-brand-800/95 to-[#1a4d48] px-4 py-4 text-white sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-200">Official platform</p>
            <h2 id="lp-resource-heading" className="mt-1 font-display text-xl font-semibold">
              {subject.learningPassport?.label || "Learning Passport"}
            </h2>
            <p className="mt-1 text-sm text-brand-100">
              Ministry of Education and Skills Development · UNICEF · Microsoft
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <p className="text-sm leading-relaxed text-slate-600">
              Sign in with your school username to access curriculum lessons, revision materials, and BEC past papers on Botswana Learning Passport.
            </p>
            <a
              href={lpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Open Learning Passport <IconExternal />
            </a>
          </div>
        </section>
      ) : null}

      {subject.resources?.length ? (
        <section aria-labelledby="study-resources-heading">
          <h2 id="study-resources-heading" className="font-display text-lg font-semibold text-brand-900">
            Free supplementary resources
          </h2>
          <ul className="mt-3 space-y-2">
            {subject.resources.map((resource) => {
              const href = safeExternalUrl(resource.url);
              if (!href) return null;
              return (
                <li key={resource.title}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm transition hover:border-brand-200 hover:shadow-sm"
                  >
                    <span>
                      <span className="font-semibold text-stone-900">{resource.title}</span>
                      {resource.type ? (
                        <span className="ml-2 text-xs text-slate-500">
                          {RESOURCE_TYPE_LABELS[resource.type] ?? resource.type}
                        </span>
                      ) : null}
                    </span>
                    <IconExternal className="shrink-0 text-brand-700" />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {subject.revisionTips?.length ? (
        <section aria-labelledby="study-tips-heading">
          <h2 id="study-tips-heading" className="font-display text-lg font-semibold text-brand-900">
            Revision tips for university planning
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
            {subject.revisionTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {relatedProgrammes.length ? (
        <section aria-labelledby="study-programmes-heading">
          <h2 id="study-programmes-heading" className="font-display text-lg font-semibold text-brand-900">
            Programmes that need strong {subject.label}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            These programmes list {subject.label} (or a related requirement) in Thuto. Confirm exact grades on each institution&apos;s site.
          </p>
          <ul className="mt-4 space-y-2">
            {relatedProgrammes.map((programme) => {
              const req = subject.requirementKey
                ? programme.subjectRequirements?.[subject.requirementKey]
                : null;
              return (
                <li key={programme.id}>
                  <Link
                    to={`/programmes/${programme.id}`}
                    className="focus-ring flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm transition hover:border-brand-200 hover:shadow-sm"
                  >
                    <span>
                      <span className="font-semibold text-stone-900">{programme.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{programme.university}</span>
                    </span>
                    <span className="text-xs font-semibold text-brand-800">
                      {typeof programme.minPoints === "number" ? `${programme.minPoints} pts` : "Points TBC"}
                      {req ? ` · ${subject.label} ${req}+` : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link to="/programmes" className="mt-3 inline-flex text-sm font-semibold text-brand-800 underline">
            Browse all programmes
          </Link>
        </section>
      ) : null}

      <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
        <p className="font-semibold text-brand-900">Check your eligibility</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Enter your BGCSE grades in the Predictor to see how your {subject.label} result affects programme matches.
        </p>
        <Link
          to="/predictor"
          className="focus-ring mt-3 inline-flex rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          Open Predictor
        </Link>
      </div>
    </div>
  );
}
