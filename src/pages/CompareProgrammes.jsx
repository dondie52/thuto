import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { evaluateProgramme, readPredictorSession, SUBJECT_FIELDS } from "../lib/admissions.js";
import EligibilityPill from "../components/EligibilityPill.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { fetchProgrammes } from "../lib/programmesData.js";

const REQ_LABEL = Object.fromEntries(SUBJECT_FIELDS.map(({ key, label }) => [key, label]));

/**
 * @param {string | null | undefined} raw
 * @returns {string[]}
 */
function parseIdsParam(raw) {
  if (raw == null || String(raw).trim() === "") return [];
  const parts = String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

/**
 * @param {object[]} programmes
 * @returns {string[]}
 */
function requirementKeys(programmes) {
  const keys = new Set();
  for (const p of programmes) {
    const r = p.subjectRequirements || {};
    for (const k of Object.keys(r)) keys.add(k);
  }
  const ordered = [];
  for (const { key } of SUBJECT_FIELDS) {
    if (keys.has(key)) ordered.push(key);
  }
  for (const k of keys) {
    if (!ordered.includes(k)) ordered.push(k);
  }
  return ordered;
}

/**
 * @param {object[]} programmes
 * @param {string} key
 */
function subjectValuesDiffer(programmes, key) {
  const vals = programmes.map((p) => {
    const v = p.subjectRequirements?.[key];
    return v == null || v === "" ? null : String(v).trim().toUpperCase();
  });
  const norm = vals.map((v) => (v == null ? "__none__" : v));
  return new Set(norm).size > 1;
}

function formatApplicationDeadline(iso) {
  if (iso == null || String(iso).trim() === "") return null;
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function CompareProgrammes() {
  useDocumentTitle("Compare programmes | Thuto");
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProgrammes, setAllProgrammes] = useState([]);
  const [error, setError] = useState(null);

  const requestedIds = useMemo(() => parseIdsParam(searchParams.get("ids")), [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    fetchProgrammes({ signal: ac.signal })
      .then((data) => {
        if (!cancelled) setAllProgrammes(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Load failed");
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const byId = useMemo(() => {
    const m = new Map();
    for (const p of allProgrammes) m.set(p.id, p);
    return m;
  }, [allProgrammes]);

  const validationMessage = useMemo(() => {
    if (error) return error;
    if (!allProgrammes.length) return null;
    if (requestedIds.length < 2) {
      return "Add at least two programme IDs to compare, e.g. /compare?ids=ub-bsc-cs,ub-ba-econ";
    }
    if (requestedIds.length > 3) {
      return "You can compare at most three programmes at once. Remove extra ids from the URL.";
    }
    const missing = requestedIds.filter((id) => !byId.has(id));
    if (missing.length) {
      return `Unknown programme id(s): ${missing.join(", ")}`;
    }
    return null;
  }, [error, requestedIds, byId, allProgrammes.length]);

  const selected = useMemo(() => {
    if (validationMessage) return [];
    return requestedIds.map((id) => byId.get(id)).filter(Boolean);
  }, [requestedIds, byId, validationMessage]);

  const minPointsList = selected.map((p) => p.minPoints).filter((n) => Number.isFinite(n));
  const minPtsLow = minPointsList.length ? Math.min(...minPointsList) : null;
  const minPtsHigh = minPointsList.length ? Math.max(...minPointsList) : null;
  const reqKeys = useMemo(() => requirementKeys(selected), [selected]);

  const feeDomesticList = selected
    .map((p) => p.fees?.domestic)
    .filter((n) => typeof n === "number" && Number.isFinite(n));
  const feeLow = feeDomesticList.length ? Math.min(...feeDomesticList) : null;
  const feeHigh = feeDomesticList.length ? Math.max(...feeDomesticList) : null;

  const predSnap = readPredictorSession();
  const eligibilityFor = useCallback(
    (p) => {
      if (predSnap.grades == null || predSnap.total == null) return null;
      return evaluateProgramme(p, predSnap.grades, predSnap.total);
    },
    [predSnap.grades, predSnap.total],
  );

  const removeProgrammeFromUrl = useCallback(
    (idToRemove) => {
      const next = requestedIds.filter((x) => x !== idToRemove);
      if (next.length === 0) setSearchParams({});
      else setSearchParams({ ids: next.join(",") });
    },
    [requestedIds, setSearchParams],
  );

  const showDeadlineRow = selected.some((p) => p.applicationDeadline);
  const showApplyRow = selected.some((p) => p.applyUrl);

  if (!error && !allProgrammes.length) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold text-brand-900">Compare programmes</h1>
        <p className="text-sm text-slate-600">Loading programme data…</p>
      </div>
    );
  }

  if (validationMessage || !selected.length) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold text-brand-900">Compare programmes</h1>
        <p className="text-sm text-slate-700">{validationMessage ?? "Could not build comparison."}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/programmes" className="font-medium text-brand-700 underline">
            Browse programmes
          </Link>
          <Link to="/saved" className="font-medium text-brand-700 underline">
            Saved programmes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">Compare programmes</h1>
        <p className="mt-2 text-sm text-slate-600">
          Side-by-side view for up to three programmes. Share this page using your browser - the list is in the URL.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-brand-200 bg-white shadow-sm">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-brand-200 bg-brand-50/80">
              <th className="sticky left-0 z-[1] min-w-[140px] bg-brand-50/95 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Detail
              </th>
              {selected.map((p) => {
                const el = eligibilityFor(p);
                return (
                  <th key={p.id} className="min-w-[180px] px-3 py-3 align-bottom">
                    <div className="flex flex-col gap-2">
                      <div>
                        <span className="font-display text-sm font-bold text-brand-900">{p.name}</span>
                        <span className="mt-1 block text-xs font-normal text-slate-600">{p.university}</span>
                      </div>
                      {el ? <EligibilityPill eligibility={el} /> : null}
                      <button
                        type="button"
                        onClick={() => removeProgrammeFromUrl(p.id)}
                        className="self-start text-xs font-semibold text-red-700 underline hover:text-red-900"
                      >
                        Remove from compare
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            <tr>
              <th className="sticky left-0 bg-white px-3 py-2 text-xs font-medium text-slate-500">Duration</th>
              {selected.map((p) => (
                <td key={p.id} className="px-3 py-2 font-medium text-brand-900">
                  {p.duration ?? "-"}
                </td>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 bg-white px-3 py-2 text-xs font-medium text-slate-500">Min points (best six)</th>
              {selected.map((p) => {
                const low =
                  Number.isFinite(p.minPoints) && p.minPoints === minPtsLow && minPtsLow !== minPtsHigh;
                const high =
                  Number.isFinite(p.minPoints) && p.minPoints === minPtsHigh && minPtsLow !== minPtsHigh;
                return (
                  <td
                    key={p.id}
                    className={[
                      "px-3 py-2 font-semibold",
                      low && "bg-emerald-50 text-emerald-900",
                      high && "bg-amber-50 text-amber-950",
                      minPtsLow === minPtsHigh && "text-brand-900",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    title={low ? "Lower bar among this set" : high ? "Higher bar among this set" : undefined}
                  >
                    {p.minPoints ?? "-"}
                  </td>
                );
              })}
            </tr>
            {showDeadlineRow ? (
              <tr>
                <th className="sticky left-0 bg-white px-3 py-2 text-xs font-medium text-slate-500">Application deadline</th>
                {selected.map((p) => (
                  <td key={p.id} className="px-3 py-2 text-slate-800">
                    {p.applicationDeadline ? formatApplicationDeadline(p.applicationDeadline) : "-"}
                  </td>
                ))}
              </tr>
            ) : null}
            {showApplyRow ? (
              <tr>
                <th className="sticky left-0 bg-white px-3 py-2 text-xs font-medium text-slate-500">Apply</th>
                {selected.map((p) => (
                  <td key={p.id} className="px-3 py-2">
                    {p.applyUrl ? (
                      <a
                        href={p.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-brand-700 underline"
                      >
                        Apply / admissions
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                ))}
              </tr>
            ) : null}
            {reqKeys.map((key) => {
              const diff = subjectValuesDiffer(selected, key);
              return (
                <tr key={key}>
                  <th className="sticky left-0 bg-white px-3 py-2 text-xs font-medium text-slate-500">
                    {REQ_LABEL[key] ?? key}
                  </th>
                  {selected.map((p) => {
                    const g = p.subjectRequirements?.[key];
                    return (
                      <td
                        key={p.id}
                        className={["px-3 py-2 text-brand-900", diff && "bg-amber-50 font-semibold text-amber-950"]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {g != null && g !== "" ? `At least ${g}` : "-"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr>
              <th className="sticky left-0 bg-white px-3 py-2 text-xs font-medium text-slate-500">Fees (approx.)</th>
              {selected.map((p) => {
                const f = p.fees;
                const text =
                  f && typeof f.domestic === "number" && f.currency
                    ? `${f.currency} ${f.domestic.toLocaleString()}${f.per ? ` / ${f.per}` : ""}`
                    : "-";
                const dom = f?.domestic;
                const low =
                  typeof dom === "number" &&
                  Number.isFinite(dom) &&
                  dom === feeLow &&
                  feeLow != null &&
                  feeHigh != null &&
                  feeLow !== feeHigh;
                const high =
                  typeof dom === "number" &&
                  Number.isFinite(dom) &&
                  dom === feeHigh &&
                  feeLow != null &&
                  feeHigh != null &&
                  feeLow !== feeHigh;
                return (
                  <td
                    key={p.id}
                    className={[
                      "px-3 py-2 text-slate-800",
                      low && "bg-emerald-50 font-semibold text-emerald-900",
                      high && "bg-amber-50 font-semibold text-amber-950",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    title={low ? "Lower fee in this set" : high ? "Higher fee in this set" : undefined}
                  >
                    {text}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th className="sticky left-0 bg-white px-3 py-2 text-xs font-medium text-slate-500 align-top">Careers</th>
              {selected.map((p) => (
                <td key={p.id} className="px-3 py-2 text-slate-800">
                  {(p.careers || []).length ? (p.careers || []).join(", ") : "-"}
                </td>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 bg-white px-3 py-2 text-xs font-medium text-slate-500 align-top">Official</th>
              {selected.map((p) => (
                <td key={p.id} className="px-3 py-2">
                  {p.officialUrl ? (
                    <a href={p.officialUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline">
                      Open page
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Subject cells highlighted in amber differ between programmes in this comparison. Min points and fee highlights show the lowest and highest values in this set only (lower min points is easier; lower fees is cheaper).
      </p>
    </div>
  );
}
