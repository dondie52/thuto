import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { trackOutboundLinkClick } from "../lib/analytics.js";
import { externalGoPath, externalHostname, safeExternalUrl } from "../lib/urlSafety.js";

const VARIANT_CLASS = {
  primary:
    "inline-flex items-center rounded-full bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-800",
  secondary:
    "inline-flex items-center rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50",
  compact:
    "inline-flex shrink-0 items-center rounded-full bg-white px-3 py-1.5 font-semibold text-brand-800 ring-1 ring-brand-200 transition hover:bg-brand-50 hover:text-brand-950",
  inline: "break-all font-medium text-brand-700 underline hover:text-brand-950",
  text: "font-semibold text-brand-800 underline hover:text-brand-950",
  comparePrimary:
    "focus-ring inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-700 bg-brand-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-800 hover:shadow-card motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
  compareSecondary:
    "focus-ring inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-white/80 px-3 py-2 text-xs font-bold text-brand-800 shadow-sm transition hover:bg-brand-50 hover:shadow-card motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
  programmePrimary:
    "inline-flex rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800",
  programmeSecondary:
    "inline-flex rounded-xl border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm hover:bg-brand-50",
};

/**
 * @param {{
 *   href: unknown,
 *   children: import("react").ReactNode,
 *   variant?: keyof typeof VARIANT_CLASS,
 *   institutionName?: string,
 *   useInterstitial?: boolean,
 *   documentNotice?: boolean,
 *   className?: string,
 *   showDomain?: boolean,
 *   programmeId?: string,
 *   institutionId?: string,
 *   linkKind?: 'website' | 'apply' | 'resource' | 'other',
 * }} props
 */
export default function ExternalSiteLink({
  href,
  children,
  variant = "secondary",
  institutionName = "",
  useInterstitial = false,
  documentNotice = false,
  className = "",
  showDomain = false,
  programmeId = "",
  institutionId = "",
  linkKind = "other",
}) {
  const safeHref = safeExternalUrl(href);
  const [notice, setNotice] = useState("");

  const hostname = externalHostname(safeHref);
  const variantClass = VARIANT_CLASS[variant] || VARIANT_CLASS.secondary;
  const resolvedKind = linkKind || "other";

  const openExternal = useCallback(() => {
    if (!safeHref) return;
    window.open(safeHref, "_blank", "noopener,noreferrer");
  }, [safeHref]);

  const handleDirectClick = useCallback(
    (event) => {
      event.preventDefault();
      if (!safeHref) return;

      if (institutionId) {
        trackOutboundLinkClick({
          programmeId: programmeId || null,
          institutionId,
          destinationUrl: safeHref,
          linkKind: resolvedKind,
        });
      }

      const institution = institutionName.trim();
      const message = documentNotice
        ? "You are now accessing official documentation directly from the university's servers. Thuto does not host or modify these materials."
        : institution
          ? `You are leaving Thuto for the official ${institution} site (${hostname}).`
          : `You are leaving Thuto for ${hostname}.`;

      setNotice(message);
      window.setTimeout(() => {
        setNotice("");
        openExternal();
      }, 2000);
    },
    [
      safeHref,
      institutionName,
      hostname,
      documentNotice,
      openExternal,
      institutionId,
      programmeId,
      resolvedKind,
    ],
  );

  if (!safeHref) return null;

  if (useInterstitial) {
    const goPath = externalGoPath(safeHref, {
      programmeId: programmeId || undefined,
      institutionId: institutionId || undefined,
      linkKind: resolvedKind,
    });
    return (
      <span className="inline-flex flex-col gap-1">
        <Link
          to={goPath}
          state={{ institutionName, documentNotice }}
          className={[variantClass, className].filter(Boolean).join(" ")}
        >
          {children}
          {showDomain && hostname ? (
            <span className="ml-1 text-[10px] font-normal opacity-80">({hostname})</span>
          ) : null}
        </Link>
        {notice ? (
          <span className="text-[10px] leading-snug text-slate-600" role="status">
            {notice}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <a
        href={safeHref}
        onClick={handleDirectClick}
        className={[variantClass, className].filter(Boolean).join(" ")}
        rel="noopener noreferrer"
      >
        {children}
        {showDomain && hostname ? (
          <span className="ml-1 text-[10px] font-normal opacity-80">({hostname})</span>
        ) : null}
      </a>
      {notice ? (
        <span className="text-[10px] leading-snug text-slate-600" role="status">
          {notice}
        </span>
      ) : null}
    </span>
  );
}
