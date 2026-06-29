import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import {
  CENTER_STATUS_LABELS,
  documentTypeLabel,
  fetchAdminCenterDocuments,
  fetchCenterReports,
  formatFileSize,
  isSupabaseConfigured,
  moderateCenterDocument,
} from "../lib/thutoCenter.js";

const STATUS_FILTERS = ["pending_review", "published", "rejected", "removed", "all"];

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const tone =
    status === "published"
      ? "bg-emerald-50 text-emerald-800"
      : status === "removed" || status === "rejected"
        ? "bg-red-50 text-red-800"
        : "bg-amber-50 text-amber-800";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {CENTER_STATUS_LABELS[status] || status}
    </span>
  );
}

export default function AdminThutoCenter() {
  useDocumentTitle("Thuto Center moderation | Thuto");
  const { isLoading, isSuperuser, isSuperuserLoading, supabaseConfigured, user } = useAuth();
  const configured = supabaseConfigured && isSupabaseConfigured();

  const [documents, setDocuments] = useState([]);
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadItems() {
    setError("");
    try {
      const [docs, reportRows] = await Promise.all([
        fetchAdminCenterDocuments({ status: statusFilter }),
        fetchCenterReports(),
      ]);
      setDocuments(docs);
      setReports(reportRows);
    } catch (err) {
      setError(err.message || "Could not load Thuto Center moderation queue.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadForSuperuser() {
      if (!configured || !user?.id || !isSuperuser) {
        setDocuments([]);
        setReports([]);
        return;
      }
      setError("");
      try {
        const [docs, reportRows] = await Promise.all([
          fetchAdminCenterDocuments({ status: statusFilter }),
          fetchCenterReports(),
        ]);
        if (!cancelled) {
          setDocuments(docs);
          setReports(reportRows);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load moderation queue.");
      }
    }
    loadForSuperuser();
    return () => {
      cancelled = true;
    };
  }, [configured, user?.id, isSuperuser, statusFilter]);

  async function handleAction(documentId, action) {
    const moderationReason =
      action === "reject" || action === "remove"
        ? window.prompt("Reason for students (optional):") || ""
        : "";
    const adminNote = window.prompt("Internal admin note (optional):") || "";

    setBusyId(documentId);
    setNotice("");
    setError("");
    try {
      await moderateCenterDocument({ documentId, action, adminNote, moderationReason });
      setNotice(`Document ${action}d.`);
      await loadItems();
    } catch (err) {
      setError(err.message || "Moderation action failed.");
    } finally {
      setBusyId("");
    }
  }

  if (isLoading || isSuperuserLoading) {
    return <p className="text-sm text-stone-500">Loading admin access…</p>;
  }

  if (!configured) {
    return <p className="text-sm text-amber-800">Supabase is not configured.</p>;
  }

  if (!isSuperuser) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-2xl font-bold text-brand-900">Thuto Center moderation</h1>
        <p className="text-sm text-red-700">You do not have permission to moderate Thuto Center.</p>
        <Link to="/admin" className="text-sm font-semibold text-brand-700 underline">
          Back to admin
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/admin" className="text-sm font-semibold text-brand-700 hover:underline">
            ← Admin
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-brand-900">Thuto Center moderation</h1>
          <p className="mt-1 text-sm text-stone-600">
            Review student uploads for Botswana copyright and academic integrity compliance.
          </p>
        </div>
        <Link
          to="/center/policy"
          className="focus-ring rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800"
        >
          View policy
        </Link>
      </header>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={[
              "focus-ring rounded-full px-3 py-1.5 text-xs font-semibold",
              statusFilter === status ? "bg-brand-700 text-white" : "bg-stone-100 text-stone-700",
            ].join(" ")}
          >
            {status === "all" ? "All" : CENTER_STATUS_LABELS[status] || status}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}

      <section className="space-y-3">
        {documents.length === 0 ? (
          <p className="text-sm text-stone-500">No documents in this queue.</p>
        ) : (
          documents.map((document) => (
            <article key={document.id} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-brand-900">{document.title}</h2>
                  <p className="text-sm text-stone-600">
                    {document.courseCode} · {document.universityName} · {documentTypeLabel(document.documentType)}
                  </p>
                </div>
                <StatusBadge status={document.status} />
              </div>
              {document.description ? <p className="mt-2 text-sm text-stone-700">{document.description}</p> : null}
              <p className="mt-2 text-xs text-stone-500">
                {document.fileName} ({formatFileSize(document.fileSize)}) · Uploaded {formatDate(document.createdAt)}
                {document.reportCount > 0 ? ` · ${document.reportCount} reports` : ""}
              </p>
              {document.moderationReason ? (
                <p className="mt-2 text-xs text-amber-800">Reason: {document.moderationReason}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {document.status !== "published" ? (
                  <button
                    type="button"
                    disabled={busyId === document.id}
                    onClick={() => handleAction(document.id, "approve")}
                    className="focus-ring rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Approve (+3 credits)
                  </button>
                ) : null}
                {document.status !== "removed" ? (
                  <button
                    type="button"
                    disabled={busyId === document.id}
                    onClick={() => handleAction(document.id, "remove")}
                    className="focus-ring rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                  >
                    Remove
                  </button>
                ) : null}
                {document.status !== "rejected" ? (
                  <button
                    type="button"
                    disabled={busyId === document.id}
                    onClick={() => handleAction(document.id, "reject")}
                    className="focus-ring rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700"
                  >
                    Reject
                  </button>
                ) : null}
                {document.status === "removed" || document.status === "rejected" ? (
                  <button
                    type="button"
                    disabled={busyId === document.id}
                    onClick={() => handleAction(document.id, "restore")}
                    className="focus-ring rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800"
                  >
                    Restore
                  </button>
                ) : null}
                <Link
                  to={`/center/${document.id}`}
                  className="focus-ring rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700"
                >
                  Open
                </Link>
              </div>
            </article>
          ))
        )}
      </section>

      {reports.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-brand-900">Recent reports</h2>
          {reports.map((report) => (
            <div key={report.id} className="rounded-xl border border-red-100 bg-red-50/40 px-4 py-3 text-sm">
              <p className="font-semibold text-red-900">
                {report.reason} · document {report.document_id.slice(0, 8)}…
              </p>
              {report.details ? <p className="mt-1 text-red-800">{report.details}</p> : null}
              <p className="mt-1 text-xs text-red-700">{formatDate(report.created_at)}</p>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
