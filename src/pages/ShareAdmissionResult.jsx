import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ShareAdmissionResultForm from "../components/ShareAdmissionResultForm.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function ShareAdmissionResult() {
  useDocumentTitle("Share your result | Thuto");
  const [searchParams] = useSearchParams();
  const programmeFromQuery = (searchParams.get("programme") || "").trim();

  const [programmes, setProgrammes] = useState(/** @type {Array<{ id: string, name: string, university: string }>} */ ([]));
  const [loadError, setLoadError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data/programmes.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load programmes");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setProgrammes(
          list.map((p) => ({
            id: p.id,
            name: p.name,
            university: p.university,
          })),
        );
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e.message ?? "Load failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const initialProgrammeId = useMemo(() => {
    if (!programmeFromQuery || !programmes.length) return programmeFromQuery;
    return programmes.some((p) => p.id === programmeFromQuery) ? programmeFromQuery : "";
  }, [programmeFromQuery, programmes]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">Share your admission result</h1>
        <p className="mt-2 text-sm text-slate-600">
          Already applied? Tell us what happened anonymously. It helps future students see real score patterns. No
          account needed.{" "}
          <Link to="/privacy" className="font-medium text-brand-700 underline hover:text-brand-900">
            Privacy
          </Link>
        </p>
      </div>

      {loadError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {loadError}
        </p>
      )}

      {!loadError && programmes.length === 0 && <p className="text-sm text-slate-500">Loading programmes…</p>}

      {!loadError && programmes.length > 0 && (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <ShareAdmissionResultForm programmes={programmes} initialProgrammeId={initialProgrammeId} />
        </section>
      )}

      <p className="text-sm text-slate-600">
        <Link to="/programmes" className="font-medium text-brand-700 underline hover:text-brand-900">
          Browse programmes
        </Link>{" "}
        or{" "}
        <Link to="/predictor" className="font-medium text-brand-700 underline hover:text-brand-900">
          run the predictor
        </Link>
        .
      </p>
    </div>
  );
}
