import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { fetchUniversities } from "../lib/universitiesData.js";
import {
  CENTER_DOCUMENT_TYPES,
  CENTER_FACULTIES,
  CENTER_MAX_FILE_BYTES,
  isSupabaseConfigured,
  uploadAdminCenterDocument,
} from "../lib/thutoCenter.js";

export default function AdminCenterUpload() {
  useDocumentTitle("Upload official document | Thuto Center admin");
  const navigate = useNavigate();
  const { user, isSuperuser, isSuperuserLoading, isLoading, supabaseConfigured } = useAuth();
  const configured = supabaseConfigured && isSupabaseConfigured();

  const [universities, setUniversities] = useState([]);
  const [copyrightDeclaration, setCopyrightDeclaration] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    documentType: "past_paper",
    universityId: "",
    faculty: "",
    courseCode: "",
    academicYear: "",
    examSession: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetchUniversities()
      .then(({ list }) => setUniversities(list))
      .catch(() => setUniversities([]));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!copyrightDeclaration) {
      setError("Confirm you have the right to publish this material.");
      return;
    }

    const universityName = universities.find((uni) => uni.id === form.universityId)?.name || "";

    setBusy(true);
    try {
      const document = await uploadAdminCenterDocument({
        file,
        title: form.title,
        description: form.description,
        documentType: form.documentType,
        universityId: form.universityId,
        universityName,
        faculty: form.faculty,
        courseCode: form.courseCode,
        academicYear: form.academicYear,
        examSession: form.examSession,
      });

      setNotice("Published as an official Thuto Centre document.");
      setTimeout(() => navigate(`/center/${document.id}`), 1000);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || isSuperuserLoading) {
    return <p className="text-sm text-stone-500">Loading admin access…</p>;
  }

  if (!configured) {
    return <p className="text-sm text-amber-800">Supabase is not configured.</p>;
  }

  if (!user || !isSuperuser) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-2xl font-bold text-brand-900">Upload official document</h1>
        <p className="text-sm text-red-700">You do not have permission to upload official Centre documents.</p>
        <Link to="/admin/center" className="text-sm font-semibold text-brand-700 underline">
          Back to Centre admin
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link to="/admin/center" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Thuto Centre admin
        </Link>
        <h1 className="font-display text-2xl font-bold text-brand-900">Upload official document</h1>
        <p className="text-sm text-stone-600">
          Publish curated study materials directly to Thuto Centre. Official uploads skip moderation and are free for
          students to download.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
        <section className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <h2 className="font-semibold text-brand-900">Admin attestation</h2>
          <label className="flex items-start gap-3 text-sm text-stone-800">
            <input
              type="checkbox"
              checked={copyrightDeclaration}
              onChange={(event) => setCopyrightDeclaration(event.target.checked)}
              className="mt-1"
            />
            <span>
              I confirm this material is from an official university source or is permitted for educational sharing on
              Thuto Centre.
            </span>
          </label>
        </section>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">File (max {CENTER_MAX_FILE_BYTES / (1024 * 1024)} MB)</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="block w-full text-sm"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Title</span>
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full rounded-lg border border-stone-200 px-3 py-2"
            required
            maxLength={160}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Description (optional)</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="w-full rounded-lg border border-stone-200 px-3 py-2"
            rows={3}
            maxLength={800}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Document type</span>
          <select
            value={form.documentType}
            onChange={(event) => setForm((prev) => ({ ...prev, documentType: event.target.value }))}
            className="w-full rounded-lg border border-stone-200 px-3 py-2"
          >
            {CENTER_DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">University</span>
          <select
            value={form.universityId}
            onChange={(event) => setForm((prev) => ({ ...prev, universityId: event.target.value }))}
            className="w-full rounded-lg border border-stone-200 px-3 py-2"
            required
          >
            <option value="">Select university…</option>
            {universities.map((uni) => (
              <option key={uni.id} value={uni.id}>
                {uni.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Faculty</span>
          <select
            value={form.faculty}
            onChange={(event) => setForm((prev) => ({ ...prev, faculty: event.target.value }))}
            className="w-full rounded-lg border border-stone-200 px-3 py-2"
            required
          >
            <option value="">Select faculty…</option>
            {CENTER_FACULTIES.map((faculty) => (
              <option key={faculty} value={faculty}>
                {faculty}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-stone-700">Course code</span>
            <input
              type="text"
              value={form.courseCode}
              onChange={(event) => setForm((prev) => ({ ...prev, courseCode: event.target.value }))}
              className="w-full rounded-lg border border-stone-200 px-3 py-2"
              required
              maxLength={32}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-stone-700">Academic year (optional)</span>
            <input
              type="text"
              value={form.academicYear}
              onChange={(event) => setForm((prev) => ({ ...prev, academicYear: event.target.value }))}
              className="w-full rounded-lg border border-stone-200 px-3 py-2"
              placeholder="e.g. 2025"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Exam session (optional)</span>
          <input
            type="text"
            value={form.examSession}
            onChange={(event) => setForm((prev) => ({ ...prev, examSession: event.target.value }))}
            className="w-full rounded-lg border border-stone-200 px-3 py-2"
            placeholder="e.g. November"
          />
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="focus-ring rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {busy ? "Publishing…" : "Publish official document"}
        </button>
      </form>
    </div>
  );
}
