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
const CELL_CLASS = "min-w-[15rem] px-3 py-3 align-top sm:min-w-[16rem]";
const EMPTY_MARK = <span className="text-stone-400">Not listed</span>;
const ACTION_LINK_CLASS =
  "focus-ring inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-700 bg-brand-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-800";
const SECONDARY_ACTION_LINK_CLASS =
  "focus-ring inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-white/80 px-3 py-2 text-xs font-bold text-brand-800 shadow-sm transition hover:bg-brand-50";

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

function comparisonLabel(value, low, high, { lowerText = "Lower", higherText = "Higher" } = {}) {
  if (value == null || value === "") return null;
  if (low) return lowerText;
  if (high) return higherText;
  return "Same";
}

function ComparisonBadge({ children, tone = "neutral" }) {
  const toneClass =
    tone === "good"
      ? "border-emerald-200 bg-emerald-100/80 text-emerald-950"
      : tone === "warn"
        ? "border-amber-200 bg-amber-100/90 text-amber-950"
        : "border-brand-100 bg-brand-50 text-brand-900";
  return (
    <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold leading-5", toneClass].join(" ")}>
      {children}
    </span>
  );
}

function ValueWithBadge({ children, label, tone = "neutral" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span>{children}</span>
      {label ? <ComparisonBadge tone={tone}>{label}</ComparisonBadge> : null}
    </div>
  );
}

function ExternalAction({ href, children, variant = "primary" }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={variant === "primary" ? ACTION_LINK_CLASS : SECONDARY_ACTION_LINK_CLASS}
    >
      {children}
    </a>
  );
}

function MobileFactRow({ label, children }) {
  return (
    <div className="grid gap-1 border-t border-brand-100 py-3 first:border-t-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="text-sm leading-6 text-stone-800">{children}</dd>
    </div>
  );
}

function MobileCompareCards({
  selected,
  reqKeys,
  eligibilityFor,
  removeProgrammeFromUrl,
  minPtsLow,
  minPtsHigh,
  feeLow,
  feeHigh,
  showDeadlineRow,
}) {
  return (
    <div className="grid gap-4 md:hidden">
      {selected.map((p) => {
        const minLow = Number.isFinite(p.minPoints) && p.minPoints === minPtsLow && minPtsLow !== minPtsHigh;
        const minHigh = Number.isFinite(p.minPoints) && p.minPoints === minPtsHigh && minPtsLow !== minPtsHigh;
        const minLabel = comparisonLabel(p.minPoints, minLow, minHigh);
        const fee = p.fees;
        const feeText =
          fee && typeof fee.domestic === "number" && fee.currency
            ? `${fee.currency} ${fee.domestic.toLocaleString()}${fee.per ? ` / ${fee.per}` : ""}`
            : null;
        const dom = fee?.domestic;
        const feeLowInSet =
          typeof dom === "number" &&
          Number.isFinite(dom) &&
          dom === feeLow &&
          feeLow != null &&
          feeHigh != null &&
          feeLow !== feeHigh;
        const feeHighInSet =
          typeof dom === "number" &&
          Number.isFinite(dom) &&
          dom === feeHigh &&
          feeLow != null &&
          feeHigh != null &&
          feeLow !== feeHigh;
        const feeLabel = comparisonLabel(feeText, feeLowInSet, feeHighInSet);
        const applyHref = safeExternalUrl(p.applyUrl);
        const officialHref = safeExternalUrl(p.officialUrl);
        const eligibility = eligibilityFor(p);

        return (
          <article key={p.id} className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-card backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="flex h-10 min-w-10 items-center justify-center rounded-full bg-brand-700 px-2 text-xs font-bold text-white">
                {programmeInitials(p)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold leading-snug text-brand-900">{p.name}</h2>
                <p className="mt-1 text-xs leading-5 text-stone-600">{p.university}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {eligibility ? <EligibilityPill eligibility={eligibility} /> : null}
              <button
                type="button"
                onClick={() => removeProgrammeFromUrl(p.id)}
                className="focus-ring inline-flex min-h-10 items-center rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-800 transition hover:bg-red-100"
              >
                Remove
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <ExternalAction href={applyHref}>Apply</ExternalAction>
              <ExternalAction href={officialHref} variant="secondary">
                Official link
              </ExternalAction>
            </div>

            <dl className="mt-4">
              <MobileFactRow label="Duration">{p.duration ?? EMPTY_MARK}</MobileFactRow>
              <MobileFactRow label="Min points">
                <ValueWithBadge label={minLabel} tone={minLow ? "good" : minHigh ? "warn" : "neutral"}>
                  {p.minPoints ?? EMPTY_MARK}
                </ValueWithBadge>
              </MobileFactRow>
              {showDeadlineRow ? (
                <MobileFactRow label="Application deadline">
                  {p.applicationDeadline ? formatApplicationDeadline(p.applicationDeadline) : EMPTY_MARK}
                </MobileFactRow>
              ) : null}
              {reqKeys.map((key) => {
                const g = p.subjectRequirements?.[key];
                const diff = subjectValuesDiffer(selected, key);
                return (
                  <MobileFactRow key={key} label={REQ_LABEL[key] ?? key}>
                    <ValueWithBadge label={diff ? "Different" : "Same"} tone={diff ? "warn" : "neutral"}>
                      {g != null && g !== "" ? `At least ${g}` : EMPTY_MARK}
                    </ValueWithBadge>
                  </MobileFactRow>
                );
              })}
              <MobileFactRow label="Fees">
                <ValueWithBadge label={feeLabel} tone={feeLowInSet ? "good" : feeHighInSet ? "warn" : "neutral"}>
                  {feeText ?? EMPTY_MARK}
                </ValueWithBadge>
              </MobileFactRow>
              <MobileFactRow label="Careers">{(p.careers || []).length ? (p.careers || []).join(", ") : EMPTY_MARK}</MobileFactRow>
            </dl>
          </article>
        );
      })}
    </div>
  );
}

function CompareShell({ children, className = "", labelledBy = "compare-heading" }) {
  return (
    <section
      className={["thuto-surface-panel overflow-hidden rounded-2xl border border-white/70 p-5 backdrop-blur sm:p-6", className]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={labelledBy}
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
  const [chosenCompareIds, setChosenCompareIds] = useState(() => effectiveIds.slice(0, 3));

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

  const foundRequestedIds = useMemo(() => effectiveIds.filter((id) => byId.has(id)), [effectiveIds, byId]);
  const missingIds = useMemo(() => {
    if (!allProgrammes.length) return [];
    return effectiveIds.filter((id) => !byId.has(id));
  }, [effectiveIds, byId, allProgrammes.length]);
  const isOverLimit = foundRequestedIds.length > 3;

  useEffect(() => {
    if (!allProgrammes.length) return;
    setChosenCompareIds((current) => {
      const stillAvailable = current.filter((id) => foundRequestedIds.includes(id)).slice(0, 3);
      if (stillAvailable.length >= Math.min(foundRequestedIds.length, 3)) return stillAvailable;
      const next = [...stillAvailable];
      for (const id of foundRequestedIds) {
        if (next.length >= 3) break;
        if (!next.includes(id)) next.push(id);
      }
      return next;
    });
  }, [allProgrammes.length, foundRequestedIds]);

  const displayMessage = useMemo(() => {
    if (error) return error;
    if (!allProgrammes.length) return null;
    if (foundRequestedIds.length < 2) {
      return hasIdsParam
        ? "Pick at least two programmes to compare. This link does not have enough valid programmes yet."
        : "Pick at least two programmes to compare, then come back here for a side-by-side view.";
    }
    return null;
  }, [error, foundRequestedIds.length, hasIdsParam, allProgrammes.length]);

  const selected = useMemo(() => {
    if (displayMessage) return [];
    const ids = isOverLimit ? chosenCompareIds : foundRequestedIds.slice(0, 3);
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }, [foundRequestedIds, byId, displayMessage, isOverLimit, chosenCompareIds]);

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
      setChosenCompareIds((current) => current.filter((x) => x !== idToRemove));
      if (next.length === 0) setSearchParams({});
      else setSearchParams({ ids: next.join(",") });
    },
    [effectiveIds, setSearchParams],
  );

  const toggleChosenProgramme = useCallback(
    (id) => {
      setChosenCompareIds((current) => {
        if (current.includes(id)) return current.filter((x) => x !== id);
        if (current.length >= 3) return current;
        return [...current, id];
      });
    },
    [],
  );

  const applyChosenProgrammes = useCallback(() => {
    const next = chosenCompareIds.filter((id) => byId.has(id)).slice(0, 3);
    setCompareIds(next);
    setStoredCompareIds(next);
    if (next.length === 0) setSearchParams({});
    else setSearchParams({ ids: next.join(",") });
  }, [chosenCompareIds, byId, setSearchParams]);

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

  if (displayMessage || !selected.length) {
    return (
      <CompareShell>
        <CompareIntro>
          <p className="mt-3 max-w-prose text-sm leading-6 text-stone-700">{displayMessage ?? "Could not build comparison."}</p>
        </CompareIntro>
        {missingIds.length ? (
          <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950">
            Some programmes in this link are no longer available. Browse programmes to add current options.
          </p>
        ) : null}
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
    <div className="w-full max-w-[calc(100vw-2rem)] space-y-5 md:relative md:left-1/2 md:w-[min(calc(100vw-3rem),72rem)] md:max-w-none md:-translate-x-1/2">
      <CompareShell>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CompareIntro>
              <p className="mt-2 max-w-[32ch] text-sm leading-6 text-stone-600 sm:max-w-xl">
                Side-by-side facts for up to three programmes. Share this page from your browser; the selected programmes are saved in the URL.
              </p>
            </CompareIntro>
            <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap" aria-label="Selected institutions">
              {selected.map((programme) => (
                <span
                  key={programme.id}
                  className="inline-flex min-h-9 min-w-0 items-center gap-2 rounded-full border border-brand-100 bg-white/70 py-1 pl-1 pr-3 text-xs font-semibold text-brand-900 shadow-sm sm:w-auto"
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

      {isOverLimit ? (
        <CompareShell className="p-4 sm:p-5" labelledBy="choose-three-heading">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="choose-three-heading" className="font-display text-lg font-bold text-brand-900">
                Choose three programmes
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-700">
                You can compare three programmes at a time. Choose the three you want to keep in this comparison.
              </p>
            </div>
            <button
              type="button"
              onClick={applyChosenProgrammes}
              disabled={chosenCompareIds.length < 2}
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
            >
              Compare selected ({chosenCompareIds.length}/3)
            </button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {foundRequestedIds.map((id) => {
              const programme = byId.get(id);
              const checked = chosenCompareIds.includes(id);
              const disabled = !checked && chosenCompareIds.length >= 3;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleChosenProgramme(id)}
                  disabled={disabled}
                  className={[
                    "focus-ring flex min-h-16 items-start gap-3 rounded-xl border px-3 py-3 text-left transition",
                    checked
                      ? "border-brand-300 bg-brand-50 text-brand-950 shadow-sm"
                      : "border-white/80 bg-white/70 text-stone-700 hover:border-brand-200 hover:bg-white",
                    disabled && "cursor-not-allowed opacity-55",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-pressed={checked}
                >
                  <span
                    className={[
                      "mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border text-[11px] font-bold",
                      checked ? "border-brand-700 bg-brand-700 text-white" : "border-stone-300 bg-white text-transparent",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-snug">{programme?.name}</span>
                    <span className="mt-1 block text-xs leading-5 text-stone-600">{programme?.university}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {missingIds.length ? (
            <p className="mt-3 text-xs leading-5 text-stone-600">
              Some programmes in this link are no longer available, so they are not shown here.
            </p>
          ) : null}
        </CompareShell>
      ) : missingIds.length ? (
        <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 shadow-sm">
          Some programmes in this link are no longer available, so this comparison shows the valid ones.
        </p>
      ) : null}

      <MobileCompareCards
        selected={selected}
        reqKeys={reqKeys}
        eligibilityFor={eligibilityFor}
        removeProgrammeFromUrl={removeProgrammeFromUrl}
        minPtsLow={minPtsLow}
        minPtsHigh={minPtsHigh}
        feeLow={feeLow}
        feeHigh={feeHigh}
        showDeadlineRow={showDeadlineRow}
      />

      <div className="hidden overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-card backdrop-blur md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
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
                        <div className="grid grid-cols-2 gap-2">
                          <ExternalAction href={safeExternalUrl(p.applyUrl)}>Apply</ExternalAction>
                          <ExternalAction href={safeExternalUrl(p.officialUrl)} variant="secondary">
                            Official link
                          </ExternalAction>
                        </div>
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
                const label = comparisonLabel(p.minPoints, low, high);
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
                    <ValueWithBadge label={label} tone={low ? "good" : high ? "warn" : "neutral"}>
                      {p.minPoints ?? EMPTY_MARK}
                    </ValueWithBadge>
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
                        <ExternalAction href={applyHref}>Apply</ExternalAction>
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
                        <ValueWithBadge label={diff ? "Different" : "Same"} tone={diff ? "warn" : "neutral"}>
                          {g != null && g !== "" ? `At least ${g}` : EMPTY_MARK}
                        </ValueWithBadge>
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
                const label = comparisonLabel(text, low, high);
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
                    <ValueWithBadge label={label} tone={low ? "good" : high ? "warn" : "neutral"}>
                      {text ?? EMPTY_MARK}
                    </ValueWithBadge>
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
                      <ExternalAction href={officialHref} variant="secondary">
                        Official link
                      </ExternalAction>
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
        Comparison labels show Lower, Same, Higher, or Different next to the value. Always confirm final requirements with the institution.
      </p>
    </div>
  );
}
