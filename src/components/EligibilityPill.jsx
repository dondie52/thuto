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
  return (
    <span
      className={[
        "inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
        v.className,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={eligibility.reason ?? undefined}
    >
      {v.label}
    </span>
  );
}
