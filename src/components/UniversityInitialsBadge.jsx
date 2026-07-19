import { useState } from "react";
import { deriveUniversityInitials, resolveUniversityLogoUrl } from "../lib/universityBranding.js";

const SIZE_CLASS = {
  sm: "h-10 min-w-10 px-2 text-xs",
  md: "h-14 min-w-14 px-3 text-sm",
  lg: "h-16 min-w-16 px-3 text-base",
  xl: "h-20 min-w-20 px-4 text-lg",
};

const IMAGE_SIZE_CLASS = {
  sm: "h-10 w-10 p-1.5",
  md: "h-14 w-14 p-2",
  lg: "h-16 w-16 p-2.5",
  xl: "h-20 w-20 p-3",
};

/**
 * Institution mark: bundled logo when available, otherwise text initials.
 * Logos are for directory identification only — Thuto is not affiliated with listed institutions.
 */
export default function UniversityInitialsBadge({ university, size = "md", className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const logoUrl = resolveUniversityLogoUrl(university);
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;
  const imageSizeClass = IMAGE_SIZE_CLASS[size] || IMAGE_SIZE_CLASS.md;
  const name = String(university?.name || university?.university || "Institution").trim();

  if (logoUrl && !imageFailed) {
    return (
      <span
        className={[
          "inline-flex items-center justify-center overflow-hidden rounded-xl border border-brand-100 bg-white",
          imageSizeClass,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <img
          src={logoUrl}
          alt=""
          className="max-h-full max-w-full object-contain"
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
        <span className="sr-only">{name} logo</span>
      </span>
    );
  }

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
