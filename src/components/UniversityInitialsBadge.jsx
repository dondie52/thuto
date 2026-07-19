import { useState } from "react";
import { deriveUniversityInitials, resolveUniversityLogo } from "../lib/universityBranding.js";
import { resolveProgrammeThemeUrl } from "../lib/programmeBranding.js";

const SIZE_CLASS = {
  sm: "h-10 min-w-10 px-2 text-xs",
  md: "h-14 min-w-14 px-3 text-sm",
  lg: "h-16 min-w-16 px-3 text-base",
  xl: "h-20 min-w-20 px-4 text-lg",
};

const IMAGE_FRAME_CLASS = {
  sm: "h-10 w-10 p-1.5",
  md: "h-14 w-14 p-2",
  lg: "h-16 w-16 p-2",
  xl: "h-20 w-20 p-2.5",
};

export default function UniversityInitialsBadge({ university, size = "md", className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;
  const frameClass = IMAGE_FRAME_CLASS[size] || IMAGE_FRAME_CLASS.md;
  const logoPath = resolveUniversityLogo(university);
  const logoUrl = logoPath ? resolveProgrammeThemeUrl(logoPath) : "";
  const name = String(university?.name || "Institution").trim() || "Institution";

  if (logoUrl && !imageFailed) {
    return (
      <span
        className={[
          "inline-flex items-center justify-center overflow-hidden rounded-xl border border-brand-100 bg-white",
          frameClass,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
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
