import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import OpportunityPostsFeed from "../components/OpportunityPostsFeed.jsx";
import ExternalSiteLink from "../components/ExternalSiteLink.jsx";
import { OPPORTUNITY_CATEGORY } from "../lib/opportunityPosts.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { scrollElementIntoView } from "../lib/motion.js";
import { usePageContent } from "../hooks/usePageContent.js";
import { PAGE_CONTENT_DEFAULTS } from "../lib/pageContentDefaults.js";
import UpgradePrompt from "../components/UpgradePrompt.jsx";
import { useEntitlements } from "../hooks/useEntitlements.js";

const FUNDING_ROUTE = {
  GOVERNMENT: "government",
  INSTITUTION: "institution",
  PRIVATE: "private",
};

function IconGovBuilding({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M6 21V10l6-4 6 4v11M9 21v-4h6v4M10 14h1M13 14h1M10 10h1M13 10h1" />
    </svg>
  );
}

function IconCampus({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.33-3.516M12 14l-6.33-3.516M12 14v7" />
    </svg>
  );
}

function IconBriefcase({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M4 7h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v4M9 12h6" />
    </svg>
  );
}

function IconPhone({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.44 12.44 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.44 12.44 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function IconExternal({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7M10 14L21 3M21 14v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6" />
    </svg>
  );
}

const fundingIcons = {
  government: IconGovBuilding,
  campus: IconCampus,
  briefcase: IconBriefcase,
};

function routeIdForItem(item) {
  if (item.icon === "government") return FUNDING_ROUTE.GOVERNMENT;
  if (item.icon === "campus") return FUNDING_ROUTE.INSTITUTION;
  if (item.icon === "briefcase") return FUNDING_ROUTE.PRIVATE;
  return item.title?.toLowerCase().includes("government") ? FUNDING_ROUTE.GOVERNMENT : FUNDING_ROUTE.PRIVATE;
}

function PrivateSponsorshipPanel({ content }) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm"
      aria-labelledby="private-sponsorship-heading"
    >
      <div className="border-b border-brand-100 bg-gradient-to-r from-brand-800/95 to-[#1a4d48] px-4 py-4 text-white sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-200">{content.privateSponsorships?.kicker}</p>
        <h2 id="private-sponsorship-heading" className="mt-1 font-display text-xl font-semibold leading-snug sm:text-2xl">
          {content.privateSponsorships?.heading}
        </h2>
        <p className="mt-1 text-sm text-brand-100/95">{content.privateSponsorships?.body}</p>
      </div>
      <div className="p-4 sm:p-6">
        <OpportunityPostsFeed
          category={OPPORTUNITY_CATEGORY.PRIVATE_SPONSORSHIP}
          emptyTitle={content.privateSponsorships?.emptyTitle}
          emptyBody={content.privateSponsorships?.emptyBody}
        />
        <p className="mt-4 text-sm text-slate-600">
          {content.privateSponsorships?.internshipPrefix}{" "}
          <Link to="/internships" className="font-semibold text-brand-800 underline">
            {content.privateSponsorships?.internshipLinkText}
          </Link>
        </p>
      </div>
    </section>
  );
}

function InstitutionScholarshipsPanel() {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6"
      aria-labelledby="institution-sponsorship-heading"
    >
      <h2 id="institution-sponsorship-heading" className="font-display text-xl font-semibold text-brand-900">
        Institution scholarships
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Merit awards, faculty bursaries, and programme-specific funding are usually published on each university&apos;s
        website or notice board. Open a university profile to review deadlines, contacts, and application links in one
        place.
      </p>
      <Link
        to="/universities"
        className="focus-ring mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
      >
        Browse universities
      </Link>
    </section>
  );
}

function GovernmentSponsorshipPanel({ content, contacts, steps, portalUrl }) {
  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm">
        <div className="border-b border-brand-100 bg-gradient-to-r from-brand-800 to-[#0d4a45] px-4 py-4 text-white sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-200">{content.dtef?.kicker}</p>
          <h2 className="mt-1 font-display text-xl font-semibold leading-snug sm:text-2xl">{content.dtef?.heading}</h2>
          <p className="mt-1 text-sm text-brand-100/95">{content.dtef?.subheading}</p>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <p className="text-sm leading-relaxed text-slate-600">{content.dtef?.intro}</p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <ExternalSiteLink
              href={portalUrl}
              variant="primary"
              institutionName="DTEF"
              useInterstitial
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
            >
              {content.dtef?.portalButtonLabel}
              <IconExternal className="h-4 w-4 opacity-90" />
            </ExternalSiteLink>
            <span className="text-xs text-slate-500 sm:ml-1">{portalUrl}</span>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-stone-800">
            <p className="font-semibold text-stone-900">{content.dtef?.warningTitle}</p>
            <p className="mt-1 leading-relaxed">{content.dtef?.warningBody}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-brand-900">{content.dtef?.contactsHeading}</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {contacts.map((row) => (
                <li key={`${row.label}-${row.detail}`} className="flex items-start gap-3 rounded-xl border border-stone-200/80 bg-stone-50/80 px-3 py-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm ring-1 ring-stone-200/80">
                    <IconPhone />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-slate-900">{row.label}</p>
                    {row.tel ? (
                      <a
                        href={row.tel}
                        className="mt-0.5 block text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
                      >
                        {row.detail}
                      </a>
                    ) : (
                      <p className="mt-0.5 text-slate-600">{row.detail}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{content.dtef?.contactsNote}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-brand-900">{content.dtef?.stepsHeading}</h3>
            <ol className="mt-3 space-y-0 divide-y divide-stone-200/90 rounded-xl border border-stone-200/90 bg-stone-50/50">
              {steps.map((step, index) => (
                <li key={`${step.title}-${index}`} className="flex gap-3 px-3 py-3.5 sm:gap-4 sm:px-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white shadow-sm" aria-hidden>
                    {index + 1}
                  </span>
                  <div className="min-w-0 text-sm leading-relaxed text-slate-700">
                    <span className="font-semibold text-slate-900">{step.title}. </span>
                    {step.body}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-stone-900">{content.verify?.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-700">{content.verify?.body}</p>
        <Link to="/universities" className="mt-3 inline-flex text-sm font-semibold text-brand-800 underline">
          {content.verify?.linkLabel}
        </Link>
      </div>
    </>
  );
}

function FundingRoutePanel({ routeId, content, contacts, steps, portalUrl }) {
  if (routeId === FUNDING_ROUTE.GOVERNMENT) {
    return <GovernmentSponsorshipPanel content={content} contacts={contacts} steps={steps} portalUrl={portalUrl} />;
  }
  if (routeId === FUNDING_ROUTE.INSTITUTION) return <InstitutionScholarshipsPanel />;
  if (routeId === FUNDING_ROUTE.PRIVATE) return <PrivateSponsorshipPanel content={content} />;
  return null;
}

export default function Sponsorships() {
  useDocumentTitle("Sponsorships | Thuto");
  const { entitlements } = useEntitlements();
  const { content } = usePageContent("sponsorships", PAGE_CONTENT_DEFAULTS.sponsorships);
  const [activeRoute, setActiveRoute] = useState(null);
  const detailRef = useRef(null);
  const fundingRoutes = Array.isArray(content.fundingRoutes?.items) ? content.fundingRoutes.items : [];
  const contacts = Array.isArray(content.dtef?.contacts) ? content.dtef.contacts : [];
  const steps = Array.isArray(content.dtef?.steps) ? content.dtef.steps : [];
  const portalUrl = content.dtef?.portalUrl || "https://tef.gov.bw";

  useEffect(() => {
    if (activeRoute && detailRef.current) {
      scrollElementIntoView(detailRef.current, { block: "start" });
    }
  }, [activeRoute]);

  const handleRouteSelect = (routeId) => {
    setActiveRoute((current) => (current === routeId ? null : routeId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">Sponsorships</h1>
      </div>

      {!entitlements.sponsorshipAlerts ? (
        <UpgradePrompt
          feature="sponsorshipAlerts"
          message="Sponsorship deadlines are listed in the app on Free. Thuto Pro adds WhatsApp, SMS, and push alerts."
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Funding routes">
        {fundingRoutes.map((route) => {
          const id = routeIdForItem(route);
          const Icon = fundingIcons[route.icon] || IconBriefcase;
          const isSelected = activeRoute === id;
          return (
            <button
              key={`${id}-${route.title}`}
              type="button"
              onClick={() => handleRouteSelect(id)}
              aria-expanded={isSelected}
              aria-controls={isSelected ? `funding-route-${id}` : undefined}
              className={`focus-ring flex flex-col rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md ${
                isSelected ? "border-brand-400 ring-2 ring-brand-200" : "border-brand-100"
              }`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-800 ring-1 ring-brand-100">
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="mt-3 font-display text-lg font-semibold text-brand-900">{route.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{route.body}</p>
              <p className="mt-3 text-xs font-semibold text-brand-700">{isSelected ? "Hide details" : "View details"}</p>
            </button>
          );
        })}
      </div>

      {activeRoute ? (
        <div id={`funding-route-${activeRoute}`} ref={detailRef} className="space-y-6">
          <FundingRoutePanel
            routeId={activeRoute}
            content={content}
            contacts={contacts}
            steps={steps}
            portalUrl={portalUrl}
          />
        </div>
      ) : null}

      <p className="text-center text-sm leading-relaxed text-slate-500">
        Thuto does not submit applications to funders - always apply through the official portals and contacts listed
        for each route.
      </p>
    </div>
  );
}
