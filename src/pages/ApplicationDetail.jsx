import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import ApplicationForm from "../components/applications/ApplicationForm.jsx";
import {
  APPLICATION_STATUS_META,
  fetchApplicationEvents,
  fetchApplicationSettings,
  fetchMyApplications,
} from "../lib/applications.js";
import { fetchProgrammes } from "../lib/programmesData.js";

export default function ApplicationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [settings, setSettings] = useState(null);
  const [programme, setProgramme] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const rows = await fetchMyApplications();
      const found = rows.find((row) => row.id === id) || null;
      setApplication(found);
      if (!found) {
        setError("Application not found.");
        return;
      }
      setError(null);
      const [settingsRow, eventRows] = await Promise.all([
        fetchApplicationSettings(found.institutionId),
        fetchApplicationEvents(found.id),
      ]);
      setSettings(settingsRow);
      setEvents(eventRows);
      if (found.programmeId) {
        const programmes = await fetchProgrammes();
        setProgramme(programmes.find((p) => p.id === found.programmeId) || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this application.");
    } finally {
      setIsLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  useDocumentTitle(
    application ? `${application.programmeName || "Application"} | Thuto` : "Application | Thuto",
  );

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Sign in to view this application.</p>
        <Link to="/auth?mode=login" className="text-sm font-semibold text-brand-700 underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (isLoading) return <p className="text-sm text-slate-500">Loading…</p>;

  if (error || !application) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-800">{error || "Application not found."}</p>
        <Link to="/applications" className="text-sm font-semibold text-brand-700 underline">
          Back to my applications
        </Link>
      </div>
    );
  }

  const meta = APPLICATION_STATUS_META[application.status];
  const editable = application.channel === "hosted" && application.status === "draft";

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      <Link to="/applications" className="inline-block text-sm font-medium text-brand-700 hover:underline">
        ← My applications
      </Link>

      <header className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h1 className="font-display text-xl font-bold text-brand-900">
          {application.programmeName || "Application"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{application.institutionName || application.institutionId}</p>
        <p className="mt-3 text-sm text-slate-700">
          <span className="font-semibold text-brand-900">{meta?.label}</span>
          {meta?.blurb ? ` — ${meta.blurb}` : ""}
        </p>
        {application.referenceCode ? (
          <p className="mt-1 text-sm text-slate-600">Reference: {application.referenceCode}</p>
        ) : null}
        {application.institutionMessage ? (
          <p className="mt-3 rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2 text-sm text-brand-900">
            <span className="font-semibold">From {application.institutionName || "the institution"}: </span>
            {application.institutionMessage}
          </p>
        ) : null}
      </header>

      {application.channel === "hosted" ? (
        <ApplicationForm
          application={application}
          settings={settings}
          programme={programme}
          readOnly={!editable}
          onChanged={load}
        />
      ) : (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-900">Applied on the institution&apos;s site</h2>
          <p className="mt-2 text-sm text-slate-600">
            Thuto is tracking this for you but does not hold the submission — {application.institutionName || "the institution"}{" "}
            processes it on their own system. Update the status here as you hear back.
          </p>
          {application.studentNote ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{application.studentNote}</p>
          ) : null}
        </section>
      )}

      {events.length ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-900">History</h2>
          <ol className="mt-3 space-y-3">
            {events.map((event) => (
              <li key={event.id} className="border-l-2 border-brand-100 pl-3 text-sm">
                <p className="font-medium text-brand-900">
                  {event.event_type === "status_changed"
                    ? `Status changed to ${APPLICATION_STATUS_META[event.to_status]?.label || event.to_status}`
                    : event.event_type === "submitted"
                      ? "Application submitted"
                      : event.event_type === "note"
                        ? "Note added"
                        : event.event_type}
                </p>
                {event.message ? <p className="mt-0.5 text-slate-600">{event.message}</p> : null}
                <p className="mt-0.5 text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
