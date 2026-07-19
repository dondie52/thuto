import ExternalSiteLink from "./ExternalSiteLink.jsx";
import { resolveInternationalGuidance } from "../lib/marketLocales.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

/**
 * StudyPortals-style guidance for applicants from outside the destination country.
 * @param {{ university: Record<string, unknown>, marketCountry?: string | null }} props
 */
export default function InternationalApplicantsSection({ university, marketCountry }) {
  const guidance = resolveInternationalGuidance(university, marketCountry);
  const applyHref = safeExternalUrl(university?.applyUrl || university?.website);

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-brand-900">{guidance.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{guidance.summary}</p>
      <p className="mt-2 text-xs text-slate-500">
        Destination: {guidance.countryLabel}. Guidance only — always verify with the institution and official immigration
        sources.
      </p>

      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-brand-900">
        {guidance.steps.map((step) => (
          <li key={step} className="leading-relaxed">
            {step}
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap gap-2">
        {applyHref ? (
          <ExternalSiteLink href={applyHref} variant="secondary" institutionName={university?.name}>
            How to apply (official site)
          </ExternalSiteLink>
        ) : null}
        {(guidance.links || []).map((link) => {
          const href = safeExternalUrl(link.url);
          if (!href) return null;
          return (
            <ExternalSiteLink key={link.url} href={href} variant="secondary" institutionName={link.title}>
              {link.title}
            </ExternalSiteLink>
          );
        })}
      </div>
    </section>
  );
}
