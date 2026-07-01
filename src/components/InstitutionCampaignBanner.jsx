import { Link } from "react-router-dom";
import ExternalSiteLink from "./ExternalSiteLink.jsx";
import { getInstitutionCampaign } from "../lib/institutionCampaigns.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

/** @type {Record<string, string>} */
const FACULTY_TONE_CLASS = {
  teal: "border-teal-200 bg-teal-50 text-teal-950",
  purple: "border-violet-200 bg-violet-50 text-violet-950",
  red: "border-red-200 bg-red-50 text-red-950",
  green: "border-emerald-200 bg-emerald-50 text-emerald-950",
  orange: "border-orange-200 bg-orange-50 text-orange-950",
};

/**
 * @param {{ institutionId: string, institutionName?: string, compact?: boolean, showProfileLink?: boolean }} props
 */
export default function InstitutionCampaignBanner({
  institutionId,
  institutionName: institutionNameProp,
  compact = false,
  showProfileLink = true,
}) {
  const campaign = getInstitutionCampaign(institutionId);
  if (!campaign) return null;

  const institutionName = institutionNameProp || campaign.institutionName || "Partner institution";

  const applyHref = safeExternalUrl(campaign.applyUrl);

  if (compact) {
    return (
      <aside
        className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-4"
        aria-label={`${institutionName} intake promotion`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700">Partner promotion</p>
        <p className="mt-1 font-display text-base font-semibold text-brand-900">{campaign.intakeLabel}</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">{campaign.spotlightDescription}</p>
        {applyHref ? (
          <ExternalSiteLink
            href={applyHref}
            variant="primary"
            institutionName={institutionName}
            useInterstitial
            className="mt-3 inline-flex"
          >
            Apply online
          </ExternalSiteLink>
        ) : (
          <Link
            to={`/universities/${institutionId}`}
            className="focus-ring mt-3 inline-flex text-sm font-semibold text-brand-800 underline"
          >
            View full promotion →
          </Link>
        )}
      </aside>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card"
      aria-labelledby={`institution-campaign-${institutionId}`}
    >
      <div className="bg-gradient-to-br from-sky-600 via-brand-700 to-brand-900 px-5 py-6 text-white sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-100">{campaign.tagline}</p>
        <h2 id={`institution-campaign-${institutionId}`} className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">
          {campaign.headline}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-50/95">{campaign.spotlightDescription}</p>
      </div>

      {campaign.faculties?.length ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          {campaign.faculties.map((faculty) => (
            <article
              key={faculty.name}
              className={[
                "rounded-2xl border p-3",
                FACULTY_TONE_CLASS[faculty.tone] || "border-stone-200 bg-stone-50 text-stone-900",
              ].join(" ")}
            >
              <h3 className="text-xs font-bold uppercase tracking-wide">{faculty.name}</h3>
              <ul className="mt-2 space-y-1 text-sm leading-snug">
                {faculty.programmes.map((programme) => (
                  <li key={programme}>• {programme}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : null}

      <div className="space-y-4 border-t border-stone-100 px-4 py-5 sm:px-5">
        {campaign.offers?.length ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">Student offers</p>
            <ul className="mt-2 space-y-1 text-sm text-stone-700">
              {campaign.offers.map((offer) => (
                <li key={offer}>• {offer}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-2xl bg-red-700 px-4 py-4 text-center text-white">
          <p className="font-display text-lg font-bold uppercase tracking-wide sm:text-xl">{campaign.intakeLabel}</p>
        </div>

        {campaign.requirements?.length ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-600">Application requirements</p>
            <ul className="mt-2 space-y-1 text-sm text-stone-700">
              {campaign.requirements.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {applyHref ? (
            <ExternalSiteLink href={applyHref} variant="primary" institutionName={institutionName} useInterstitial>
              Apply online
            </ExternalSiteLink>
          ) : null}
          {showProfileLink ? (
            <Link
              to={`/universities/${institutionId}`}
              className="focus-ring inline-flex min-h-10 items-center justify-center rounded-full border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              View institution profile
            </Link>
          ) : null}
        </div>

        <p className="text-[11px] leading-relaxed text-stone-500">
          Programme lists and offers are based on the institution&apos;s published promotion. Confirm intake dates,
          fees, and eligibility on the official Limkokwing Botswana site before you apply.
        </p>
      </div>
    </section>
  );
}
