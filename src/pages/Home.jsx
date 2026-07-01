import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  APPLICATION_DATES_DISCLAIMER,
  daysFromTodayTo,
  formatCountdown,
  isDeadlineWithinDays,
} from "../lib/applicationDates.js";
import { fetchUniversities } from "../lib/universitiesData.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { usePageContent } from "../hooks/usePageContent.js";
import { PAGE_CONTENT_DEFAULTS } from "../lib/pageContentDefaults.js";
import HomeCenterCreators from "../components/home/HomeCenterCreators.jsx";
import HomeDailySpotlight from "../components/home/HomeDailySpotlight.jsx";
import HomeFeaturedUniversities from "../components/home/HomeFeaturedUniversities.jsx";
import HomeHeroPartner from "../components/home/HomeHeroPartner.jsx";
import HomePartnerCampaigns from "../components/home/HomePartnerCampaigns.jsx";

const URGENT_DEADLINES_PREVIEW = 5;

export default function Home() {
  useDocumentTitle("Thuto - Your Botswana Tertiary Companion");
  const { content } = usePageContent("home", PAGE_CONTENT_DEFAULTS.home);
  const [urgentUnis, setUrgentUnis] = useState([]);
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    fetchUniversities({ signal: ac.signal })
      .then(({ list }) => {
        if (cancelled) return;
        const urgent = list
          .filter((u) => u.applicationClose && isDeadlineWithinDays(u.applicationClose, 30))
          .map((u) => ({
            ...u,
            daysLeft: daysFromTodayTo(u.applicationClose),
          }))
          .filter((u) => u.daysLeft != null && u.daysLeft >= 0)
          .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
        setUrgentUnis(urgent);
      })
      .catch(() => {
        if (!cancelled) setUrgentUnis([]);
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const visibleUrgentUnis = showAllDeadlines ? urgentUnis : urgentUnis.slice(0, URGENT_DEADLINES_PREVIEW);
  const hasMoreDeadlines = urgentUnis.length > URGENT_DEADLINES_PREVIEW;

  return (
    <div className="space-y-10">
      {urgentUnis.length > 0 ? (
        <div
          className="animate-fade-up rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-amber-100/80 p-4 shadow-card"
          role="status"
        >
          <p className="font-display text-sm font-semibold text-amber-950">Application deadlines soon</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-950/85">
            One or more institutions have an application close date within the next 30 days. Confirm dates on each
            university&apos;s official site.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {visibleUrgentUnis.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-t border-amber-200/70 pt-2 first:border-t-0 first:pt-0"
              >
                <Link
                  to={`/universities/${u.id}`}
                  className="focus-ring rounded font-medium text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
                >
                  {u.name}
                </Link>
                <span className="text-xs font-semibold text-amber-900">
                  {u.applicationClose ? formatCountdown(u.applicationClose) : ""}
                </span>
              </li>
            ))}
          </ul>
          {hasMoreDeadlines && !showAllDeadlines ? (
            <button
              type="button"
              onClick={() => setShowAllDeadlines(true)}
              className="focus-ring mt-2 rounded text-xs font-semibold text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
            >
              See all deadlines ({urgentUnis.length})
            </button>
          ) : null}
          <p className="mt-3 text-[10px] leading-snug text-amber-900/80">{APPLICATION_DATES_DISCLAIMER}</p>
        </div>
      ) : null}

      <HomeHeroPartner
        kicker={content.hero?.kicker}
        ctaLabel={content.hero?.ctaLabel}
      />

      <HomePartnerCampaigns />

      <HomeDailySpotlight
        kicker={content.dailySpotlight?.kicker}
        heading={content.dailySpotlight?.heading}
        body={content.dailySpotlight?.body}
        ctaLabel={content.dailySpotlight?.ctaLabel}
        fallbackIds={content.featuredUniversities?.fallbackIds}
      />

      <HomeFeaturedUniversities
        heading={content.featuredUniversities?.heading}
        body={content.featuredUniversities?.body}
        fallbackIds={content.featuredUniversities?.fallbackIds}
      />

      <HomeCenterCreators
        kicker={content.centerCreators?.kicker}
        heading={content.centerCreators?.heading}
        body={content.centerCreators?.body}
        emptyTitle={content.centerCreators?.emptyTitle}
        emptyBody={content.centerCreators?.emptyBody}
      />
    </div>
  );
}
