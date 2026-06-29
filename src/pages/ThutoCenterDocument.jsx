import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import UpgradePrompt from "../components/UpgradePrompt.jsx";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useEntitlements } from "../hooks/useEntitlements.js";
import {
  CENTER_REPORT_REASONS,
  CENTER_UNLOCK_COST_CREDITS,
  CENTER_UPLOAD_REWARD_CREDITS,
  documentTypeLabel,
  fetchCenterCredits,
  fetchCenterDocument,
  formatFileSize,
  getCenterDownloadUrl,
  reportCenterDocument,
  toggleCenterHelpful,
  unlockCenterDocument,
  canDownloadCenterDocument,
} from "../lib/thutoCenter.js";

export default function ThutoCenterDocument() {
  const { documentId } = useParams();
  const { user, profile } = useAuth();
  const { isPremium } = useEntitlements();

  const [document, setDocument] = useState(null);
  const [credits, setCredits] = useState({ balance: 0 });
  const [canDownload, setCanDownload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reportReason, setReportReason] = useState("copyright");
  const [reportDetails, setReportDetails] = useState("");
  const [showReport, setShowReport] = useState(false);

  useDocumentTitle(document?.title ? `${document.title} | Thuto Center` : "Thuto Center | Thuto");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const doc = await fetchCenterDocument(documentId);
        if (!doc) {
          if (!cancelled) setError("Document not found.");
          return;
        }
        const [creditRow, allowed] = await Promise.all([
          user?.id ? fetchCenterCredits() : Promise.resolve({ balance: 0 }),
          user?.id ? canDownloadCenterDocument(documentId, profile) : Promise.resolve(false),
        ]);
        if (!cancelled) {
          setDocument(doc);
          setCredits(creditRow);
          setCanDownload(allowed || isPremium);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load document.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [documentId, user?.id, isPremium, profile?.premium_until, profile?.premium_status]);

  async function handleUnlock() {
    setBusy("unlock");
    setError("");
    setNotice("");
    try {
      const result = await unlockCenterDocument(documentId);
      if (!result?.ok) {
        if (result?.error === "no_credits") {
          setError(`You need ${CENTER_UNLOCK_COST_CREDITS} unlock credit. Upload materials to earn ${CENTER_UPLOAD_REWARD_CREDITS} credits per approval.`);
        } else {
          setError("Could not unlock this document.");
        }
        return;
      }
      setCanDownload(true);
      setCredits((prev) => ({
        ...prev,
        balance: typeof result.credits_remaining === "number" ? result.credits_remaining : prev.balance,
      }));
      setNotice(result.already ? "You already have access." : "Unlocked. You can download now.");
    } catch (err) {
      setError(err.message || "Unlock failed.");
    } finally {
      setBusy("");
    }
  }

  async function handleDownload() {
    setBusy("download");
    setError("");
    try {
      const { url, fileName } = await getCenterDownloadUrl(documentId, profile);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.rel = "noopener";
      anchor.click();
      setNotice("Download started.");
    } catch (err) {
      setError(err.message || "Download failed.");
    } finally {
      setBusy("");
    }
  }

  async function handleHelpful() {
    setBusy("helpful");
    try {
      await toggleCenterHelpful(documentId);
      const doc = await fetchCenterDocument(documentId);
      setDocument(doc);
    } catch (err) {
      setError(err.message || "Could not update helpful vote.");
    } finally {
      setBusy("");
    }
  }

  async function handleReport(event) {
    event.preventDefault();
    setBusy("report");
    setError("");
    try {
      await reportCenterDocument({ documentId, reason: reportReason, details: reportDetails });
      setNotice("Report submitted. Our team will review it.");
      setShowReport(false);
    } catch (err) {
      setError(err.message || "Could not submit report.");
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <p className="text-sm text-stone-500">Loading document…</p>;
  }

  if (!document) {
    return (
      <div className="space-y-4">
        <Link to="/center" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Thuto Center
        </Link>
        <p className="text-sm text-red-700">{error || "Document not found."}</p>
      </div>
    );
  }

  const isOwner = user?.id === document.uploaderId;
  const isPublished = document.status === "published";

  return (
    <div className="space-y-6">
      <Link to="/center" className="text-sm font-semibold text-brand-700 hover:underline">
        ← Thuto Center
      </Link>

      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
          {document.courseCode} · {document.faculty}
        </p>
        <h1 className="font-display text-2xl font-bold text-brand-900">{document.title}</h1>
        <p className="text-sm text-stone-600">{document.universityName}</p>
      </header>

      {!isPublished ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Status: <strong>{document.status.replace("_", " ")}</strong>
          {document.moderationReason ? ` — ${document.moderationReason}` : ""}
        </p>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
        {document.description ? <p className="text-sm text-stone-700">{document.description}</p> : null}
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Type</dt>
            <dd className="font-medium text-stone-800">{documentTypeLabel(document.documentType)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">File</dt>
            <dd className="font-medium text-stone-800">
              {document.fileName} ({formatFileSize(document.fileSize)})
            </dd>
          </div>
          {document.academicYear ? (
            <div>
              <dt className="text-stone-500">Academic year</dt>
              <dd className="font-medium text-stone-800">{document.academicYear}</dd>
            </div>
          ) : null}
          {document.examSession ? (
            <div>
              <dt className="text-stone-500">Exam session</dt>
              <dd className="font-medium text-stone-800">{document.examSession}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-stone-500">Helpful votes</dt>
            <dd className="font-medium text-stone-800">{document.helpfulCount}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Downloads</dt>
            <dd className="font-medium text-stone-800">{document.downloadCount}</dd>
          </div>
        </dl>
      </section>

      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
      {notice ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p> : null}

      {isPublished ? (
        <section className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
          <h2 className="font-semibold text-brand-900">Download</h2>
          {!user ? (
            <p className="text-sm text-stone-700">
              <Link to="/auth?mode=login" className="font-semibold underline">
                Sign in
              </Link>{" "}
              to unlock or download.
            </p>
          ) : isOwner || canDownload || isPremium ? (
            <button
              type="button"
              disabled={busy === "download"}
              onClick={handleDownload}
              className="focus-ring min-h-11 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {busy === "download" ? "Preparing…" : "Download file"}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-stone-700">
                Use {CENTER_UNLOCK_COST_CREDITS} unlock credit to download. You have <strong>{credits.balance}</strong>{" "}
                credits.
              </p>
              <button
                type="button"
                disabled={busy === "unlock"}
                onClick={handleUnlock}
                className="focus-ring min-h-11 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
              >
                {busy === "unlock" ? "Unlocking…" : `Unlock (${CENTER_UNLOCK_COST_CREDITS} credit)`}
              </button>
              <UpgradePrompt
                feature="centerInstantAccess"
                message="Or upgrade to Thuto Pro for instant access to all Thuto Center downloads."
                compact
              />
              <p className="text-xs text-stone-600">
                <Link to="/center/upload" className="font-semibold text-brand-700 underline">
                  Upload your own material
                </Link>{" "}
                to earn {CENTER_UPLOAD_REWARD_CREDITS} credits when approved.
              </p>
            </div>
          )}
        </section>
      ) : null}

      {isPublished && user ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy === "helpful"}
            onClick={handleHelpful}
            className="focus-ring rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Mark helpful
          </button>
          <button
            type="button"
            onClick={() => setShowReport((value) => !value)}
            className="focus-ring rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Report issue
          </button>
        </div>
      ) : null}

      {showReport ? (
        <form onSubmit={handleReport} className="space-y-3 rounded-2xl border border-red-200 bg-red-50/40 p-4">
          <h3 className="font-semibold text-red-900">Report this document</h3>
          <p className="text-xs text-red-800">
            For copyright concerns under Botswana law, include the work title and why you believe it infringes.
          </p>
          <select
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            className="w-full rounded-xl border border-red-200 px-3 py-2.5 text-sm"
          >
            {CENTER_REPORT_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
          <textarea
            value={reportDetails}
            onChange={(event) => setReportDetails(event.target.value)}
            rows={3}
            placeholder="Additional details"
            className="w-full rounded-xl border border-red-200 px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={busy === "report"}
            className="focus-ring rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
          >
            Submit report
          </button>
        </form>
      ) : null}

      <p className="text-xs text-stone-500">
        Downloads are for personal study only. See the{" "}
        <Link to="/center/policy" className="font-semibold text-brand-700 underline">
          Thuto Center Botswana policy
        </Link>
        .
      </p>
    </div>
  );
}
