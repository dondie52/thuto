import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useApplications } from "../hooks/useApplications.js";
import { useAuth } from "../lib/auth.jsx";
import { isSupabaseConfigured } from "../lib/supabase.js";
import ExternalSiteLink from "../components/ExternalSiteLink.jsx";
import ManualApplicationForm from "../components/applications/ManualApplicationForm.jsx";
import {
  APPLICATION_STATUS_META,
  SELF_MANAGED_STATUSES,
  applicationDeadlineState,
  applicationStatusLabel,
} from "../lib/applications.js";
import { APPLICATION_DATES_DISCLAIMER } from "../lib/applicationDates.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

const TONE_CLASS = {
  slate: "bg-slate-100 text-slate-700",
  amber: "bg-amber-100 text-amber-950",
  brand: "bg-brand-100 text-brand-900",
  emerald: "bg-emerald-100 text-emerald-900",
  rose: "bg-rose-100 text-rose-900",
};

function StatusPill({ status }) {
  const meta = APPLICATION_STATUS_META[status];
  if (!meta) return null;
  return (
    <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${TONE_CLASS[meta.tone]}`}>
      {meta.label}
    </span>
  );
}

function ApplicationCard({ application, onStatusChange, onConfirm, onWithdraw }) {
  const { countdown, urgent } = applicationDeadlineState(application);
  const hosted = application.channel === "hosted";
  const applyHref = safeExternalUrl(application.externalUrl);
  const unconfirmed = !hosted && !application.externalConfirmed;

  return (
    <li className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-brand-900">
            {application.programmeId ? (
              <Link to={`/programmes/${application.programmeId}`} className="hover:underline">
                {application.programmeName || "Programme"}
              </Link>
            ) : (
              application.programmeName || "Application"
            )}
          </p>
          <p className="mt-0.5 text-sm text-slate-600">{application.institutionName || application.institutionId}</p>
        </div>
        <StatusPill status={application.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-medium text-brand-800">
          {hosted ? "Applied through Thuto" : unconfirmed ? "Started on the institution site" : "Applied on institution site"}
        </span>
        {countdown ? (
          <span
            className={[
              "rounded-full px-2.5 py-0.5 font-medium",
              urgent ? "bg-amber-100 text-amber-950" : "bg-slate-100 text-slate-700",
            ].join(" ")}
          >
            {countdown}
          </span>
        ) : null}
        {application.referenceCode ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
            Ref {application.referenceCode}
          </span>
        ) : null}
      </div>

      {application.institutionMessage ? (
        <p className="mt-3 rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2 text-sm text-brand-900">
          <span className="font-semibold">From {application.institutionName || "the institution"}: </span>
          {application.institutionMessage}
        </p>
      ) : null}

      {unconfirmed ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2">
          <p className="text-sm text-amber-950">
            Thuto recorded that you opened this application. Did you finish and submit it?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onConfirm(application.id)}
              className="focus-ring rounded-xl bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
            >
              Yes, I submitted it
            </button>
            <button
              type="button"
              onClick={() => onWithdraw(application.id)}
              className="focus-ring rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
            >
              No, remove this
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {!hosted ? (
          <label className="text-xs text-slate-600">
            <span className="mr-2 font-medium">Status</span>
            <select
              value={SELF_MANAGED_STATUSES.includes(application.status) ? application.status : "pending"}
              onChange={(event) => onStatusChange(application.id, event.target.value)}
              className="rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-xs"
            >
              {SELF_MANAGED_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {applicationStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {hosted && application.status === "draft" ? (
          <Link
            to={`/applications/${application.id}`}
            className="focus-ring rounded-xl bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
          >
            Continue application
          </Link>
        ) : null}

        {hosted && application.status !== "draft" ? (
          <Link
            to={`/applications/${application.id}`}
            className="focus-ring rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
          >
            View submission
          </Link>
        ) : null}

        {!hosted && applyHref ? (
          <ExternalSiteLink
            href={applyHref}
            variant="secondary"
            institutionName={application.institutionName}
            institutionId={application.institutionId}
            programmeId={application.programmeId || undefined}
            linkKind="apply"
            useInterstitial
          >
            Open institution portal
          </ExternalSiteLink>
        ) : null}

        {application.status !== "withdrawn" ? (
          <button
            type="button"
            onClick={() => onWithdraw(application.id)}
            className="focus-ring rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:text-red-700 hover:underline"
          >
            Withdraw
          </button>
        ) : null}
      </div>
    </li>
  );
}

function Section({ title, description, applications, ...handlers }) {
  if (!applications.length) return null;
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-semibold text-brand-900">{title}</h2>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      <ul className="space-y-3">
        {applications.map((application) => (
          <ApplicationCard key={application.id} application={application} {...handlers} />
        ))}
      </ul>
    </section>
  );
}

export default function MyApplications() {
  useDocumentTitle("My applications | Thuto");
  const { user } = useAuth();
  const { buckets, counts, applications, isLoading, error, setStatus, confirmExternal, withdraw, refresh } =
    useApplications();
  const [showWithdrawn, setShowWithdrawn] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const summary = useMemo(
    () => [
      { key: "pending", label: "Pending", value: counts.pending || 0 },
      { key: "awaiting_interview", label: "Awaiting interview", value: counts.awaiting_interview || 0 },
      { key: "accepted", label: "Accepted", value: counts.accepted || 0 },
      { key: "rejected", label: "Rejected", value: counts.rejected || 0 },
    ],
    [counts],
  );

  const handlers = { onStatusChange: setStatus, onConfirm: confirmExternal, onWithdraw: withdraw };
  const hasAny = applications.length > 0;

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">My applications</h1>
        <p className="mt-2 text-sm text-slate-600">
          Everywhere you have applied through Thuto, plus the applications you started on an institution&apos;s own
          site. Update the status yourself as you hear back.
        </p>
        <p className="mt-2 text-xs text-slate-500">{APPLICATION_DATES_DISCLAIMER}</p>
        {!user && isSupabaseConfigured() ? (
          <p className="mt-3 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
            You are tracking applications on this device.{" "}
            <Link to="/auth?mode=login" className="font-semibold underline">
              Sign in
            </Link>{" "}
            to keep them across devices and to apply through Thuto where institutions support it.
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {hasAny ? (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summary.map((item) => (
            <div key={item.key} className="rounded-xl border border-brand-200 bg-white px-3 py-3 text-center shadow-sm">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</dt>
              <dd className="mt-1 text-xl font-bold text-brand-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {isLoading && !hasAny ? <p className="text-sm text-slate-500">Loading…</p> : null}

      <Section
        title="Needs your attention"
        description="Drafts to finish, deadlines inside 30 days, and applications Thuto has not confirmed yet."
        applications={buckets.actionNeeded}
        {...handlers}
      />
      <Section title="In progress" applications={buckets.inProgress} {...handlers} />
      <Section title="Decided" applications={buckets.decided} {...handlers} />

      {!hasAny && !isLoading ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-10 text-center">
          <p className="font-medium text-brand-900">No applications tracked yet</p>
          <p className="mt-2 text-sm text-slate-600">
            When you tap Apply on a programme, Thuto starts tracking it here.
          </p>
          <Link
            to="/programmes"
            className="mt-4 inline-block text-sm font-semibold text-brand-700 underline hover:text-brand-900"
          >
            Browse programmes
          </Link>
        </div>
      ) : null}

      {/* A lot of students find Thuto after they have already applied somewhere. */}
      <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        {manualOpen ? (
          <ManualApplicationForm
            onCancel={() => setManualOpen(false)}
            onSaved={async () => {
              setManualOpen(false);
              await refresh();
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="focus-ring rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100"
          >
            Add an application manually
          </button>
        )}
      </div>

      {buckets.withdrawn.length ? (
        <div>
          <button
            type="button"
            onClick={() => setShowWithdrawn((open) => !open)}
            className="focus-ring text-sm font-semibold text-brand-700 hover:underline"
          >
            {showWithdrawn ? "Hide" : "Show"} withdrawn ({buckets.withdrawn.length})
          </button>
          {showWithdrawn ? (
            <ul className="mt-3 space-y-3">
              {buckets.withdrawn.map((application) => (
                <ApplicationCard key={application.id} application={application} {...handlers} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
