/**
 * Maps `evaluateProgramme()` status to student-friendly labels (Pillar 3 tone).
 * @param {{ status: 'Qualified' | 'Close' | 'Not eligible' | 'Unknown' }} props.eligibility
 */
const VARIANT = {
  Qualified: {
    label: "Safe choice",
    className: "bg-emerald-100 text-emerald-900",
  },
  Close: {
    label: "Reach",
    className: "bg-amber-100 text-amber-950",
  },
  "Not eligible": {
    label: "Unlikely",
    className: "bg-rose-100 text-rose-900",
  },
  Unknown: {
    label: "Check with institution",
    className: "border border-slate-200 bg-slate-50 text-slate-700",
  },
};

export default function EligibilityPill({ eligibility, className = "" }) {
  if (!eligibility?.status) return null;
  const v = VARIANT[eligibility.status];
  if (!v) return null;
  // Results on a non-BGCSE scale go through a linear conversion against BGCSE-calibrated
  // thresholds, so the label should not sound more certain than the arithmetic is.
  const estimated = Boolean(eligibility.estimated) && eligibility.status !== "Unknown";
  const title = [eligibility.reason, estimated ? "Converted from your exam system — treat as an estimate." : null]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      className={[
        "inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
        v.className,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={title || undefined}
    >
      {estimated ? `${v.label} (est.)` : v.label}
    </span>
  );
}
