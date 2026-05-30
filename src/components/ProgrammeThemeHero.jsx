import { resolveProgrammeVisual } from "../lib/programmeBranding.js";

/**
 * Contextual photo band for programme detail and featured cards.
 */
export default function ProgrammeThemeHero({
  programme,
  variant = "detail",
  className = "",
  children,
}) {
  const { imageUrl, label, themeKey } = resolveProgrammeVisual(programme);
  const isCompact = variant === "compact";
  const isCard = variant === "card";

  const heightClass = isCompact
    ? "h-14"
    : isCard
      ? "h-28 sm:h-32"
      : "h-40 sm:h-48";

  return (
    <div
      className={[
        "relative isolate overflow-hidden",
        isCard ? "rounded-t-2xl" : "rounded-none",
        heightClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-programme-theme={themeKey}
    >
      {imageUrl ? (
        <div
          className="absolute inset-0 bg-slate-800 bg-cover bg-center"
          style={{ backgroundImage: `url("${imageUrl}")` }}
          role="img"
          aria-label={label}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-800 to-brand-950" aria-hidden />
      )}
      <div
        className={[
          "absolute inset-0",
          isCompact
            ? "bg-gradient-to-r from-brand-950/85 via-brand-900/55 to-brand-900/25"
            : "bg-gradient-to-t from-brand-950/92 via-brand-900/65 to-brand-800/35 sm:bg-gradient-to-r sm:from-brand-950/90 sm:via-brand-900/70 sm:to-brand-800/30",
        ].join(" ")}
        aria-hidden
      />
      {children ? <div className="relative z-10 flex h-full flex-col justify-end p-4 sm:p-5">{children}</div> : null}
    </div>
  );
}
