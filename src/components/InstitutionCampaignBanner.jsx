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

/** @type {Record<string, string>} */
const HERO_ACCENT_CLASS = {
  brand: "bg-gradient-to-br from-sky-600 via-brand-700 to-brand-900",
  orange: "bg-gradient-to-br from-orange-600 via-orange-700 to-stone-900",
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
  const heroClass = HERO_ACCENT_CLASS[campaign.heroAccent || "brand"] || HERO_ACCENT_CLASS.brand;
  const ctaClass =
    campaign.heroAccent === "orange"
      ? "rounded-2xl bg-stone-900 px-4 py-4 text-center text-white"
      : "rounded-2xl bg-red-700 px-4 py-4 text-center text-white";

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
      <div className={`${heroClass} px-5 py-6 text-white sm:px-6`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">{campaign.tagline}</p>
        <h2 id={`institution-campaign-${institutionId}`} className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">
          {campaign.headline}
        </h2>
        {campaign.bannerStrip ? (
          <p className="mt-4 rounded-xl bg-black/80 px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide text-white">
            {campaign.bannerStrip}
          </p>
        ) : null}
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90">{campaign.spotlightDescription}</p>
      </div>

      {campaign.leadership?.length ? (
        <div className="border-b border-orange-100 bg-orange-50 px-4 py-4 sm:px-5">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-900">School leadership</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {campaign.leadership.map((leader) => (
              <li key={leader.name} className="rounded-xl border border-orange-200/80 bg-white px-3 py-2">
                <p className="text-sm font-semibold text-stone-900">{leader.name}</p>
                <p className="mt-0.5 text-xs leading-snug text-stone-600">{leader.title}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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

        <div className={ctaClass}>
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
          Programme lists are based on the institution&apos;s published promotion. Confirm intake dates, fees, and
          eligibility on the official {institutionName} site before you apply.
        </p>
      </div>
    </section>
  );
}
