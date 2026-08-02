import { marketCountryLabel } from "../../lib/marketCountry.js";

/**
 * StudyPortals ACT–inspired insight modules for one institution (own data only).
 * @param {{
 *   universityName?: string,
 *   programmeCount?: number,
 *   tier?: string,
 *   newLeads?: number,
 *   summary: {
 *     totals: Record<string, number>,
 *     topProgrammes: Array<{ id: string, label?: string, count: number }>,
 *     topCountries: Array<{ id: string, count: number }>,
 *     disciplines: Array<{ id: string, count: number }>,
 *     linkKinds: Array<{ id: string, count: number }>,
 *     outboundClicks: number,
 *   },
 *   profileCompleteness?: { completed: number, total: number, ratio: number },
 *   onOpenModule?: (id: string) => void,
 * }} props
 */
export default function PartnerInsightsDashboard({
  universityName = "Your institution",
  programmeCount = 0,
  tier = "verified",
  newLeads = 0,
  summary,
  profileCompleteness,
  onOpenModule,
}) {
  const profileViews = summary.totals.institution_profile_view || 0;
  const programmeViews = summary.totals.programme_view || 0;
  const applyClicks = summary.totals.apply_click || 0;
  const outbound = summary.outboundClicks || 0;
  const topCountry = summary.topCountries[0];
  const clarity = profileCompleteness?.total
    ? `${profileCompleteness.completed}/${profileCompleteness.total} profile sections complete`
    : "Complete your public profile for stronger student trust";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-900 via-brand-800 to-teal-800 p-5 text-white shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-100/90">Institution analytics</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">{universityName}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-teal-50/90">
          A simple readout of how students discover your institution, which programmes attract attention, and whether they
          continue to your official links.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HeroMetric label="Institution profile views" value={profileViews} hint="Last 30 days" />
          <HeroMetric label="Programme page views" value={programmeViews} hint="Last 30 days" />
          <HeroMetric label="Portal clicks" value={applyClicks + outbound} hint="Students opened your official links" />
          <HeroMetric
            label="Top viewer market"
            value={topCountry ? marketCountryLabel(topCountry.id) : "—"}
            hint={topCountry ? `${topCountry.count} engagements` : "Traffic will appear here"}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-teal-100/90">
          <span className="rounded-full bg-white/10 px-3 py-1">{programmeCount} programmes listed</span>
          <span className="rounded-full bg-white/10 px-3 py-1 capitalize">{tier} partner</span>
          <span className="rounded-full bg-white/10 px-3 py-1">{newLeads} new leads</span>
          <span className="rounded-full bg-white/10 px-3 py-1">{clarity}</span>
          {onOpenModule ? (
            <button
              type="button"
              onClick={() => onOpenModule("leads")}
              className="rounded-full bg-white/20 px-3 py-1 font-semibold text-white transition hover:bg-white/30"
            >
              Open leads
            </button>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ModuleCard
          kicker="01 · Top demand"
          title="Most viewed programmes"
          question="These are the programmes students are opening most often."
        >
          <BarList
            rows={summary.topProgrammes.slice(0, 6).map((row) => ({
              id: row.id,
              label: row.label || row.id,
              count: row.count,
            }))}
            empty="No programme views yet — traffic will appear as students browse."
          />
        </ModuleCard>

        <ModuleCard
          kicker="02 · Audience location"
          title="Where interest comes from"
          question="Use this to spot where your current awareness is strongest."
        >
          <BarList
            rows={summary.topCountries.slice(0, 6).map((row) => ({
              id: row.id,
              label: marketCountryLabel(row.id),
              count: row.count,
            }))}
            empty="No origin data yet."
            accent="amber"
          />
        </ModuleCard>

        <ModuleCard
          kicker="03 · Discovery context"
          title="Fields students explore"
          question="This shows which academic areas are driving attention to your catalogue."
        >
          <BarList
            rows={summary.disciplines.slice(0, 6).map((row) => ({
              id: row.id,
              label: row.id,
              count: row.count,
            }))}
            empty="No discipline views yet."
            accent="slate"
          />
        </ModuleCard>

        <ModuleCard
          kicker="04 · Conversion signals"
          title="Clicks to your website and admissions links"
          question="Students are moving from discovery on Thuto to your official channels."
          className="lg:col-span-2"
        >
          <BarList
            rows={summary.linkKinds.map((row) => ({
              id: row.id,
              label: formatLinkKind(row.id),
              count: row.count,
            }))}
            empty="No outbound link clicks yet."
            accent="teal"
          />
        </ModuleCard>
      </div>
    </div>
  );
}

function formatLinkKind(kind) {
  const map = {
    website: "Official website",
    apply: "Apply / admissions",
    resource: "Resources & documents",
    other: "Other links",
  };
  return map[kind] || String(kind || "other").replace(/_/g, " ");
}

function HeroMetric({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-3 backdrop-blur-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-100/80">{label}</p>
      <p className="mt-1 font-display text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-teal-100/70">{hint}</p> : null}
    </div>
  );
}

function ModuleCard({ kicker, title, question, children, actionLabel, onAction, className = "" }) {
  return (
    <section className={["rounded-2xl border border-brand-200 bg-white p-5 shadow-sm", className].join(" ")}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">{kicker}</p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-brand-900">{title}</h3>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-semibold text-brand-800 underline hover:text-brand-950"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-sm italic text-slate-600">{question}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BarList({ rows, empty, accent = "brand" }) {
  if (!rows?.length) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }
  const max = Math.max(...rows.map((r) => r.count), 1);
  const fill =
    accent === "amber"
      ? "bg-amber-500"
      : accent === "slate"
        ? "bg-slate-500"
        : accent === "teal"
          ? "bg-teal-600"
          : "bg-brand-700";

  return (
    <ul className="space-y-3">
      {rows.map((row, index) => {
        const width = Math.max(6, Math.round((row.count / max) * 100));
        return (
          <li key={row.id}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-slate-800">
                <span className="mr-2 text-xs font-semibold text-slate-400">{index + 1}.</span>
                {row.label}
              </span>
              <span className="shrink-0 tabular-nums font-semibold text-brand-900">{row.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-50">
              <div
                className={["h-full rounded-full transition-[width] duration-500 ease-out", fill].join(" ")}
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
