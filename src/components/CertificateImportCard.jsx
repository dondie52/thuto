import { useEffect, useRef, useState } from "react";
import { BGCSE_SUBJECTS } from "../lib/bgcseSubjects.js";
import {
  buildImportReview,
  importCertificateFile,
  reviewIssueLabel,
  updateReviewRows,
} from "../lib/certificateImport.js";

const GRADE_OPTIONS = ["", "A*", "A", "B", "C", "D", "E", "F", "G", "U"];

function reviewSummary(issues) {
  if (!issues.length) return "Everything looks ready to use.";
  const unique = [...new Set(issues.map((issue) => issue.type))];
  return unique.map(reviewIssueLabel).join(" · ");
}

export default function CertificateImportCard({ onUseGrades }) {
  const inputRef = useRef(null);
  const [isBusy, setIsBusy] = useState(false);
  const [importError, setImportError] = useState("");
  const [progressLabel, setProgressLabel] = useState("");
  const [review, setReview] = useState(() => buildImportReview([]));

  useEffect(() => {
    return () => {
      if (review.sourceMeta?.previewUrl) URL.revokeObjectURL(review.sourceMeta.previewUrl);
    };
  }, [review]);

  function openPicker() {
    inputRef.current?.click();
  }

  async function onFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError("");
    setProgressLabel("");
    setIsBusy(true);
    try {
      const nextReview = await importCertificateFile(file, (message) => {
        if (message?.status) setProgressLabel(message.status);
      });
      setReview(nextReview);
      if (!nextReview.rows.length) {
        setImportError("I could not find clear subjects and grades yet. You can still add or correct rows below.");
      }
    } catch (error) {
      setImportError(error.message || "That certificate could not be read.");
      setReview(buildImportReview([]));
    } finally {
      setIsBusy(false);
      event.target.value = "";
    }
  }

  function updateRow(rowKey, patch) {
    setReview((current) =>
      updateReviewRows(current.rows.map((row) => (row.key === rowKey ? { ...row, ...patch } : row))),
    );
  }

  function addRow() {
    setReview((current) =>
      updateReviewRows([...current.rows, { key: `manual-${Date.now()}`, subjectId: "", grade: "", sourceLabel: "" }]),
    );
  }

  function removeRow(rowKey) {
    setReview((current) => updateReviewRows(current.rows.filter((row) => row.key !== rowKey)));
  }

  function cancelReview() {
    if (review.sourceMeta?.previewUrl) URL.revokeObjectURL(review.sourceMeta.previewUrl);
    setReview(buildImportReview([]));
    setImportError("");
    setProgressLabel("");
  }

  function useGrades() {
    const cleaned = review.rows.filter((row) => row.subjectId && row.grade);
    if (!cleaned.length || review.issues.length) return;
    onUseGrades(cleaned);
    cancelReview();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm">
      <div className="border-b border-brand-100 bg-brand-50/70 px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Certificate import</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-brand-900">Upload your results instead</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Upload a certificate photo or PDF, review what Thuto finds, then use the confirmed rows in your predictor.
            </p>
          </div>
          <button
            type="button"
            onClick={openPicker}
            disabled={isBusy}
            className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? "Reading certificate..." : "Upload certificate"}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
        />
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Supported files: phone photos, scans, screenshots, and PDF certificates. You will always review subjects and
          grades before they replace your current list.
        </p>
        {progressLabel ? <p className="mt-2 text-xs font-medium text-brand-700">{progressLabel}</p> : null}
        {importError ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {importError}
          </p>
        ) : null}
      </div>

      {review.rows.length || review.sourceMeta?.fileName ? (
        <div className="grid gap-4 px-4 py-4 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-brand-100 bg-stone-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Uploaded file</p>
              <p className="mt-1 text-sm font-semibold text-brand-900">{review.sourceMeta?.fileName || "Certificate"}</p>
              <p className="mt-1 text-xs text-slate-500">
                {review.sourceMeta?.kind === "pdf"
                  ? `${review.sourceMeta?.pageCount || 1} page PDF`
                  : "Image certificate"}
              </p>
            </div>
            {review.sourceMeta?.previewUrl ? (
              <img
                src={review.sourceMeta.previewUrl}
                alt="Uploaded certificate preview"
                className="w-full rounded-2xl border border-brand-100 object-cover shadow-sm"
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-4 text-sm leading-relaxed text-slate-600">
                PDF preview is not shown here, but the extracted subjects and grades are ready for review on the right.
              </div>
            )}
            <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Review status</p>
              <p className="mt-1 text-sm text-slate-700">{reviewSummary(review.issues)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-brand-900">Check the extracted rows</h3>
                <p className="mt-1 text-xs text-slate-500">Fix anything that looks off before using these grades.</p>
              </div>
              <button
                type="button"
                onClick={addRow}
                className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
              >
                Add row
              </button>
            </div>

            <div className="space-y-3">
              {review.rows.map((row) => {
                const rowIssues = review.issues.filter((issue) => issue.rowKey === row.key);
                return (
                  <div key={row.key} className="rounded-2xl border border-brand-100 bg-white p-3 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-[1fr_7rem_auto]">
                      <label className="block">
                        <span className="text-xs font-medium text-slate-600">Subject</span>
                        <select
                          value={row.subjectId}
                          onChange={(event) =>
                            updateRow(row.key, {
                              subjectId: event.target.value,
                              sourceLabel: event.target.value ? "" : row.sourceLabel,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                        >
                          <option value="">Choose subject...</option>
                          {BGCSE_SUBJECTS.map((subjectMeta) => (
                            <option key={subjectMeta.id} value={subjectMeta.id}>
                              {subjectMeta.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-slate-600">Grade</span>
                        <select
                          value={row.grade}
                          onChange={(event) => updateRow(row.key, { grade: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                        >
                          {GRADE_OPTIONS.map((grade) => (
                            <option key={grade || "empty"} value={grade}>
                              {grade || "-"}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        className="self-end rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Remove
                      </button>
                    </div>
                    {row.sourceLabel ? (
                      <p className="mt-2 text-xs text-slate-500">Detected text: {row.sourceLabel}</p>
                    ) : null}
                    {rowIssues.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {rowIssues.map((issue) => (
                          <span
                            key={`${row.key}-${issue.type}`}
                            className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-900"
                          >
                            {reviewIssueLabel(issue.type)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-brand-100 pt-3">
              <button
                type="button"
                onClick={useGrades}
                disabled={!review.rows.length || review.issues.length > 0}
                className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Use these grades
              </button>
              <button
                type="button"
                onClick={cancelReview}
                className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
