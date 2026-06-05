import { deriveUniversityInitials } from "../lib/universityBranding.js";

const SIZE_CLASS = {
  sm: "h-10 min-w-10 px-2 text-xs",
  md: "h-14 min-w-14 px-3 text-sm",
  lg: "h-16 min-w-16 px-3 text-base",
  xl: "h-20 min-w-20 px-4 text-lg",
};

export default function UniversityInitialsBadge({ university, size = "md", className = "" }) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;

  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-xl border border-brand-200 bg-brand-50 font-semibold tracking-wide text-brand-800",
        sizeClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      {deriveUniversityInitials(university)}
    </span>
  );
}
