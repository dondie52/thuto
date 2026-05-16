import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { evaluateProgramme, readPredictorSession, SUBJECT_FIELDS } from "../lib/admissions.js";
import EligibilityPill from "../components/EligibilityPill.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { compareSelectionHref, getCompareIds, setCompareIds } from "../lib/compareSelection.js";
import { fetchProgrammes } from "../lib/programmesData.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

const REQ_LABEL = Object.fromEntries(SUBJECT_FIELDS.map(({ key, label }) => [key, label]));
const ROW_HEADER_CLASS =
  "sticky left-0 z-[1] w-36 min-w-36 bg-stone-50/95 px-3 py-3 text-xs font-semibold text-stone-600 shadow-[1px_0_0_rgba(204,251,241,0.9)] sm:w-40 sm:min-w-40";
const CELL_CLASS = "min-w-[13rem] px-3 py-3 align-top sm:min-w-[14.5rem]";
const EMPTY_MARK = <span className="text-stone-400">Not listed</span>;

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

function programmeInitials(programme) {
  const short = String(programme?.universityShort || "").trim();
  if (short) return short.slice(0, 6).toUpperCase();
  const name = String(programme?.university || "").trim();
  if (!name) return "UNI";
  return name
    .replace(/[()&]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !["of", "and", "the", "in"].includes(word.toLowerCase()))
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
}

function CompareShell({ children, className = "" }) {
  return (
    <section
      className={["thuto-surface-panel overflow-hidden rounded-2xl border border-white/70 p-5 backdrop-blur sm:p-6", className]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby="compare-heading"
    >
      {children}
    </section>
  );
}

function CompareIntro({ children }) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Programme compare</p>
      <h1 id="compare-heading" className="mt-2 font-display text-2xl font-bold leading-tight text-brand-900">
        Compare programmes
      </h1>
      {children}
    </>
  );
}

export default function CompareProgrammes() {
  useDocumentTitle("Compare programmes | Thuto");
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProgrammes, setAllProgrammes] = useState([]);
  const [error, setError] = useState(null);
  const [storedCompareIds, setStoredCompareIds] = useState(() => getCompareIds());

  const rawIdsParam = searchParams.get("ids");
  const hasIdsParam = rawIdsParam != null && rawIdsParam.trim() !== "";
  const requestedIds = useMemo(() => parseIdsParam(rawIdsParam), [rawIdsParam]);
  const effectiveIds = hasIdsParam ? requestedIds : storedCompareIds;

  useEffect(() => {
    if (hasIdsParam) return;
    const href = compareSelectionHref(storedCompareIds);
    if (!href) return;
    const query = href.split("?")[1] || "";
    setSearchParams(new URLSearchParams(query), { replace: true });
  }, [hasIdsParam, setSearchParams, storedCompareIds]);

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
    if (effectiveIds.length < 2) {
      return hasIdsParam
        ? "Pick at least two programmes to compare. This link does not have enough programme IDs yet."
        : "Pick at least two programmes to compare, then come back here for a side-by-side view.";
    }
    if (effectiveIds.length > 3) {
      return "You can compare at most three programmes at once. Remove extra ids from the URL.";
    }
    const missing = effectiveIds.filter((id) => !byId.has(id));
    if (missing.length) {
      return `Unknown programme id(s): ${missing.join(", ")}`;
    }
    return null;
  }, [error, effectiveIds, hasIdsParam, byId, allProgrammes.length]);

  const selected = useMemo(() => {
    if (validationMessage) return [];
    return effectiveIds.map((id) => byId.get(id)).filter(Boolean);
  }, [effectiveIds, byId, validationMessage]);

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
      const next = effectiveIds.filter((x) => x !== idToRemove);
      setCompareIds(next);
      setStoredCompareIds(next);
      if (next.length === 0) setSearchParams({});
      else setSearchParams({ ids: next.join(",") });
    },
    [effectiveIds, setSearchParams],
  );

  const showDeadlineRow = selected.some((p) => p.applicationDeadline);
  const showApplyRow = selected.some((p) => safeExternalUrl(p.applyUrl));

  if (!error && !allProgrammes.length) {
    return (
      <CompareShell>
        <CompareIntro>
          <p className="mt-3 text-sm leading-6 text-stone-600">Loading programme data...</p>
        </CompareIntro>
        <div className="mt-5 grid gap-3" aria-hidden="true">
          <div className="h-3 w-40 rounded-full bg-brand-100/80" />
          <div className="h-20 rounded-2xl bg-white/65 shadow-sm" />
          <div className="h-20 rounded-2xl bg-white/55 shadow-sm" />
        </div>
      </CompareShell>
    );
  }

  if (validationMessage || !selected.length) {
    return (
      <CompareShell>
        <CompareIntro>
          <p className="mt-3 max-w-prose text-sm leading-6 text-stone-700">{validationMessage ?? "Could not build comparison."}</p>
        </CompareIntro>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link
            to="/programmes"
            className="focus-ring inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-brand-800"
          >
            Browse programmes
          </Link>
          <Link
            to="/saved"
            className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-brand-200 bg-white/70 px-4 py-2 font-semibold text-brand-800 shadow-sm transition hover:bg-brand-50"
          >
            Saved programmes
          </Link>
        </div>
      </CompareShell>
    );
  }

  return (
    <div className="space-y-5">
      <CompareShell>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CompareIntro>
              <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
                Side-by-side facts for up to three programmes. Share this page from your browser; the selected programmes are saved in the URL.
              </p>
            </CompareIntro>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Selected institutions">
              {selected.map((programme) => (
                <span
                  key={programme.id}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full border border-brand-100 bg-white/70 py-1 pl-1 pr-3 text-xs font-semibold text-brand-900 shadow-sm"
                >
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-700 px-1.5 text-[10px] font-bold text-white">
                    {programmeInitials(programme)}
                  </span>
                  <span className="max-w-[12rem] truncate">{programme.university}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white/65 px-4 py-3 text-sm leading-6 text-stone-700 shadow-sm sm:max-w-56">
            <span className="font-semibold text-brand-900">{selected.length} programmes</span>, {reqKeys.length} subject rows
            {predSnap.total != null ? <span className="block text-xs text-stone-500">Using your saved predictor result: {predSnap.total} points.</span> : null}
          </div>
        </div>
      </CompareShell>

      <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-card backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <caption className="sr-only">Programme comparison table</caption>
            <thead>
              <tr className="border-b border-brand-200 bg-brand-50/90">
                <th className="sticky left-0 z-[2] w-36 min-w-36 bg-brand-50 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-stone-600 shadow-[1px_0_0_rgba(153,246,228,0.75)] sm:w-40 sm:min-w-40">
                  Detail
                </th>
                {selected.map((p) => {
                  const el = eligibilityFor(p);
                  return (
                    <th key={p.id} className={`${CELL_CLASS} align-bottom`}>
                      <div className="flex flex-col gap-2">
                        <div>
                          <span className="font-display text-sm font-bold leading-snug text-brand-900">{p.name}</span>
                          <span className="mt-1 block text-xs font-normal leading-5 text-stone-600">{p.university}</span>
                        </div>
                        {el ? <EligibilityPill eligibility={el} /> : null}
                        <button
                          type="button"
                          onClick={() => removeProgrammeFromUrl(p.id)}
                          className="focus-ring -ml-2 inline-flex min-h-9 items-center self-start rounded-lg px-2 text-xs font-semibold text-red-700 underline decoration-red-200 underline-offset-4 transition hover:bg-red-50 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
            <tr>
              <th className={ROW_HEADER_CLASS}>Duration</th>
              {selected.map((p) => (
                <td key={p.id} className={`${CELL_CLASS} font-medium text-brand-900`}>
                  {p.duration ?? EMPTY_MARK}
                </td>
              ))}
            </tr>
            <tr>
              <th className={ROW_HEADER_CLASS}>Min points (best six)</th>
              {selected.map((p) => {
                const low =
                  Number.isFinite(p.minPoints) && p.minPoints === minPtsLow && minPtsLow !== minPtsHigh;
                const high =
                  Number.isFinite(p.minPoints) && p.minPoints === minPtsHigh && minPtsLow !== minPtsHigh;
                return (
                  <td
                    key={p.id}
                    className={[
                      CELL_CLASS,
                      "font-semibold",
                      low && "bg-emerald-50 text-emerald-900",
                      high && "bg-amber-50 text-amber-950",
                      minPtsLow === minPtsHigh && "text-brand-900",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    title={low ? "Lower bar among this set" : high ? "Higher bar among this set" : undefined}
                  >
                    {p.minPoints ?? EMPTY_MARK}
                  </td>
                );
              })}
            </tr>
            {showDeadlineRow ? (
              <tr>
                <th className={ROW_HEADER_CLASS}>Application deadline</th>
                {selected.map((p) => (
                  <td key={p.id} className={`${CELL_CLASS} text-stone-800`}>
                    {p.applicationDeadline ? formatApplicationDeadline(p.applicationDeadline) : EMPTY_MARK}
                  </td>
                ))}
              </tr>
            ) : null}
            {showApplyRow ? (
              <tr>
                <th className={ROW_HEADER_CLASS}>Apply</th>
                {selected.map((p) => {
                  const applyHref = safeExternalUrl(p.applyUrl);
                  return (
                    <td key={p.id} className={CELL_CLASS}>
                      {applyHref ? (
                        <a
                          href={applyHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="focus-ring inline-flex min-h-9 items-center rounded-lg px-2 font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 hover:bg-brand-50 hover:text-brand-900"
                        >
                          Apply / admissions
                        </a>
                      ) : (
                        EMPTY_MARK
                      )}
                    </td>
                  );
                })}
              </tr>
            ) : null}
            {reqKeys.map((key) => {
              const diff = subjectValuesDiffer(selected, key);
              return (
                <tr key={key}>
                  <th className={ROW_HEADER_CLASS}>
                    {REQ_LABEL[key] ?? key}
                  </th>
                  {selected.map((p) => {
                    const g = p.subjectRequirements?.[key];
                    return (
                      <td
                        key={p.id}
                        className={[CELL_CLASS, "text-brand-900", diff && "bg-amber-50 font-semibold text-amber-950"]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {g != null && g !== "" ? `At least ${g}` : EMPTY_MARK}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr>
              <th className={ROW_HEADER_CLASS}>Fees (approx.)</th>
              {selected.map((p) => {
                const f = p.fees;
                const text =
                  f && typeof f.domestic === "number" && f.currency
                    ? `${f.currency} ${f.domestic.toLocaleString()}${f.per ? ` / ${f.per}` : ""}`
                    : null;
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
                      CELL_CLASS,
                      "text-stone-800",
                      low && "bg-emerald-50 font-semibold text-emerald-900",
                      high && "bg-amber-50 font-semibold text-amber-950",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    title={low ? "Lower fee in this set" : high ? "Higher fee in this set" : undefined}
                  >
                    {text ?? EMPTY_MARK}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th className={`${ROW_HEADER_CLASS} align-top`}>Careers</th>
              {selected.map((p) => (
                <td key={p.id} className={`${CELL_CLASS} leading-6 text-stone-800`}>
                  {(p.careers || []).length ? (p.careers || []).join(", ") : EMPTY_MARK}
                </td>
              ))}
            </tr>
            <tr>
              <th className={`${ROW_HEADER_CLASS} align-top`}>Official</th>
              {selected.map((p) => {
                const officialHref = safeExternalUrl(p.officialUrl);
                return (
                  <td key={p.id} className={CELL_CLASS}>
                    {officialHref ? (
                      <a
                        href={officialHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-ring inline-flex min-h-9 items-center rounded-lg px-2 font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 hover:bg-brand-50 hover:text-brand-900"
                      >
                        Open page
                      </a>
                    ) : (
                      EMPTY_MARK
                    )}
                  </td>
                );
              })}
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p className="rounded-2xl border border-white/70 bg-white/55 px-4 py-3 text-xs leading-5 text-slate-600 shadow-sm backdrop-blur">
        Amber cells differ across this comparison. Green marks the lower points or fee value in this set; amber marks the higher value. Always confirm final requirements with the institution.
      </p>
    </div>
  );
}
