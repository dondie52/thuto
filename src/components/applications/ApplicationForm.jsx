import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../lib/auth.jsx";
import {
  CONSENT_VERSION,
  createDocumentSignedUrl,
  missingRequirements,
  removeApplicationDocument,
  requiredDocumentsForApplication,
  saveHostedDraft,
  submitHostedApplication,
  uploadApplicationDocument,
} from "../../lib/applications.js";

/**
 * Core fields every institution needs. Prefilled from the profile so a student who has already
 * onboarded is not retyping their own name.
 */
const CORE_FIELDS = [
  { key: "full_name", label: "Full name", required: true, profileKey: "full_name" },
  { key: "national_id", label: "National ID / passport number", required: true },
  { key: "date_of_birth", label: "Date of birth", type: "date", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "phone", label: "Phone", type: "tel", required: true },
  { key: "nationality", label: "Nationality" },
  { key: "postal_address", label: "Postal address" },
  { key: "school_name", label: "Secondary school" },
  { key: "year_completed", label: "Year completed" },
];

/** Institution-configurable extras, keyed by what they store in required_fields. */
const OPTIONAL_FIELD_LABELS = {
  guardian_name: "Parent or guardian name",
  guardian_phone: "Parent or guardian phone",
  sponsorship_status: "How you plan to pay",
  accessibility_needs: "Disability or accessibility needs",
  residence_required: "Do you need campus accommodation?",
  previous_tertiary: "Previous tertiary study",
  employment_history: "Employment history",
  personal_statement: "Personal statement",
};

const LONG_FIELDS = new Set(["personal_statement", "employment_history", "accessibility_needs"]);

// A form filled and submitted in under eight seconds was not filled by a person.
const MIN_TIME_ON_FORM_MS = 8000;

export default function ApplicationForm({ application, settings, programme, readOnly = false, onChanged }) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState(() => application.formData || {});
  const [consent, setConsent] = useState(Boolean(application.consentAt));
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const openedAtRef = useRef(Date.now());

  const institutionName = application.institutionName || "the institution";
  const documents = requiredDocumentsForApplication(settings, programme);
  const uploadedByKey = useMemo(
    () => new Map((application.documents || []).map((doc) => [doc.key, doc])),
    [application.documents],
  );

  const extraFields = useMemo(
    () =>
      (settings?.requiredFields || []).map((key) => ({
        key,
        label: OPTIONAL_FIELD_LABELS[key] || key.replace(/_/g, " "),
        required: true,
        long: LONG_FIELDS.has(key),
      })),
    [settings?.requiredFields],
  );

  useEffect(() => {
    if (readOnly) return;
    setFormData((current) => {
      const next = { ...current };
      for (const field of CORE_FIELDS) {
        if (!next[field.key] && field.profileKey && profile?.[field.profileKey]) {
          next[field.key] = profile[field.profileKey];
        }
      }
      return next;
    });
  }, [profile, readOnly]);

  const outstanding = missingRequirements({ ...application, formData }, settings, programme);
  const missingCore = CORE_FIELDS.filter(
    (field) => field.required && !String(formData[field.key] || "").trim(),
  ).map((field) => field.label);
  const totalOutstanding = outstanding.total + missingCore.length;

  function setField(key, value) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

  async function handleSaveDraft() {
    setBusy(true);
    setError("");
    try {
      await saveHostedDraft(application.id, { formData });
      setStatus("Draft saved.");
      await onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your draft.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(doc, file) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await uploadApplicationDocument({
        applicationId: application.id,
        docKey: doc.key,
        docLabel: doc.label,
        file,
      });
      setStatus(`${doc.label} uploaded.`);
      await onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that file.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveDocument(storagePath) {
    setBusy(true);
    try {
      await removeApplicationDocument(application.id, storagePath);
      await onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that file.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenDocument(storagePath) {
    const url = await createDocumentSignedUrl(storagePath);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (honeypot) return;
    if (Date.now() - openedAtRef.current < MIN_TIME_ON_FORM_MS) {
      setError("Take a moment to check your answers before submitting.");
      return;
    }
    if (!consent) {
      setError("You need to agree to send this application to the institution.");
      return;
    }
    if (totalOutstanding > 0) {
      setError("Some required answers or documents are still missing.");
      return;
    }
    setBusy(true);
    try {
      await saveHostedDraft(application.id, { formData: { ...formData, marketing_consent: marketingConsent } });
      await submitHostedApplication(application.id);
      setStatus("Application submitted.");
      await onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your application.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {settings?.instructions ? (
        <p className="rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
          {settings.instructions}
        </p>
      ) : null}

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-brand-900">Your details</h2>
          {!readOnly && totalOutstanding > 0 ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-950">
              {totalOutstanding} item{totalOutstanding === 1 ? "" : "s"} outstanding
            </span>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[...CORE_FIELDS, ...extraFields].map((field) => (
            <label key={field.key} className={`block text-sm ${field.long ? "sm:col-span-2" : ""}`}>
              <span className="font-medium text-slate-700">
                {field.label}
                {field.required ? <span className="text-red-700"> *</span> : null}
              </span>
              {field.long ? (
                <textarea
                  rows={4}
                  maxLength={2000}
                  disabled={readOnly}
                  value={String(formData[field.key] || "")}
                  onChange={(event) => setField(field.key, event.target.value)}
                  className={inputClass}
                />
              ) : (
                <input
                  type={field.type || "text"}
                  maxLength={200}
                  disabled={readOnly}
                  value={String(formData[field.key] || "")}
                  onChange={(event) => setField(field.key, event.target.value)}
                  className={inputClass}
                />
              )}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-900">Documents</h2>
        <p className="mt-1 text-sm text-slate-600">PDF, JPEG, PNG or WebP, up to 10 MB each.</p>
        <ul className="mt-4 space-y-3">
          {documents.map((doc) => {
            const uploaded = uploadedByKey.get(doc.key);
            return (
              <li key={doc.key} className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-900">
                    {doc.label}
                    {doc.required !== false ? <span className="text-red-700"> *</span> : null}
                  </p>
                  {uploaded ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
                      Uploaded
                    </span>
                  ) : null}
                </div>
                {uploaded ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleOpenDocument(uploaded.storagePath)}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {uploaded.fileName || "View file"}
                    </button>
                    {!readOnly ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(uploaded.storagePath)}
                        className="font-semibold text-red-700 hover:underline"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ) : !readOnly ? (
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    disabled={busy}
                    onChange={(event) => handleUpload(doc, event.target.files?.[0])}
                    className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                  />
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Not provided.</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {!readOnly ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          {/* Bots fill every field they find; a real applicant never sees this one. */}
          <label className="sr-only" aria-hidden="true">
            Leave this field empty
            <input
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1"
            />
            <span>
              I confirm the information above is true and complete, and I agree that Thuto may send this application
              and the attached documents to <strong>{institutionName}</strong> for admissions assessment.{" "}
              {institutionName} will process it under their own privacy policy.
            </span>
          </label>

          <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(event) => setMarketingConsent(event.target.checked)}
              className="mt-1"
            />
            <span>
              {institutionName} may also contact me about other programmes and open days. (Optional.)
            </span>
          </label>

          <p className="mt-2 text-xs text-slate-500">Consent version {CONSENT_VERSION}.</p>

          {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}
          {status ? <p className="mt-3 text-sm text-emerald-800">{status}</p> : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="focus-ring rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {busy ? "Working…" : "Submit application"}
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={busy}
              className="focus-ring rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
            >
              Save draft
            </button>
          </div>
        </section>
      ) : (
        <>
          {error ? <p className="text-sm text-red-800">{error}</p> : null}
          {status ? <p className="text-sm text-emerald-800">{status}</p> : null}
        </>
      )}
    </form>
  );
}
