import { resolveProgrammeVisual } from "../lib/programmeBranding.js";

/**
 * Narrow visual strip for programme list rows (catalogue, saved, university lists).
 */
export default function ProgrammeThemeAccent({ programme, className = "" }) {
  const { imageUrl, label, themeKey } = resolveProgrammeVisual(programme);

  return (
    <div
      className={["relative w-1.5 shrink-0 self-stretch sm:w-2", className].filter(Boolean).join(" ")}
      data-programme-theme={themeKey}
      role="img"
      aria-label={label}
    >
      {imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${imageUrl}")` }}
          aria-hidden
        />
      ) : (
        <div className="absolute inset-0 bg-brand-700" aria-hidden />
      )}
      <div className="absolute inset-0 bg-brand-900/25" aria-hidden />
    </div>
  );
}
