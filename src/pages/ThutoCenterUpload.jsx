import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { fetchUniversities } from "../lib/universitiesData.js";
import {
  CENTER_DOCUMENT_TYPES,
  CENTER_FACULTIES,
  CENTER_MAX_FILE_BYTES,
  CENTER_POLICY,
  acceptCenterPolicy,
  hasAcceptedCenterPolicy,
  isSupabaseConfigured,
  uploadCenterDocument,
} from "../lib/thutoCenter.js";

export default function ThutoCenterUpload() {
  useDocumentTitle("Upload to Thuto Center | Thuto");
  const navigate = useNavigate();
  const { user, profile, supabaseConfigured } = useAuth();
  const configured = supabaseConfigured && isSupabaseConfigured();

  const [universities, setUniversities] = useState([]);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [copyrightDeclaration, setCopyrightDeclaration] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    documentType: "lecture_notes",
    universityId: profile?.university_id || "",
    faculty: "",
    courseCode: "",
    academicYear: "",
    examSession: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetchUniversities().then(setUniversities).catch(() => setUniversities([]));
  }, []);

  useEffect(() => {
    if (profile?.university_id) {
      setForm((prev) => ({ ...prev, universityId: prev.universityId || profile.university_id }));
    }
  }, [profile?.university_id]);

  useEffect(() => {
    if (!user?.id || !configured) return;
    hasAcceptedCenterPolicy()
      .then((accepted) => {
        setAlreadyAccepted(accepted);
        if (accepted) setPolicyAccepted(true);
      })
      .catch(() => {});
  }, [user?.id, configured]);

  const universityName =
    universities.find((uni) => uni.id === form.universityId)?.name || profile?.university_name || "";

  const canUpload =
    user &&
    configured &&
    policyAccepted &&
    copyrightDeclaration &&
    file &&
    form.title.trim() &&
    form.universityId &&
    form.faculty &&
    form.courseCode.trim() &&
    (profile?.university_status === "studying" || Boolean(profile?.university_id));

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!user) {
      setError("Sign in to upload to Thuto Center.");
      return;
    }

    if (profile?.university_status && profile.university_status !== "studying") {
      setError("Set your profile to “I study here” before uploading campus materials.");
      return;
    }

    if (!policyAccepted) {
      setError("Accept the Thuto Center Botswana policy before uploading.");
      return;
    }

    if (!copyrightDeclaration) {
      setError("Confirm the copyright declaration to continue.");
      return;
    }

    setBusy(true);
    try {
      if (!alreadyAccepted) {
        await acceptCenterPolicy();
        setAlreadyAccepted(true);
      }

      const document = await uploadCenterDocument({
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

      setNotice("Upload received. It will appear after moderation. You will earn 3 unlock credits when approved.");
      setTimeout(() => navigate(`/center/${document.id}`), 1200);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link to="/center" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Thuto Center
        </Link>
        <h1 className="font-display text-2xl font-bold text-brand-900">Upload study material</h1>
        <p className="text-sm text-stone-600">
          Uploads are free. Only original notes and officially released past papers are allowed under Botswana
          copyright rules.
        </p>
      </header>

      {!user ? (
        <p className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
          <Link to="/auth?mode=login" className="font-semibold underline">
            Sign in
          </Link>{" "}
          to upload.
        </p>
      ) : null}

      {profile?.university_status === "aspiring" ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Thuto Center uploads are for current students. Update your profile to “I study here” on the{" "}
          <Link to="/profile" className="font-semibold underline">
            profile page
          </Link>
          .
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
        <section className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <h2 className="font-semibold text-brand-900">Botswana policy</h2>
          <p className="text-sm text-stone-700">
            Read the full{" "}
            <Link to="/center/policy" className="font-semibold text-brand-800 underline">
              Thuto Center policy
            </Link>{" "}
            before uploading.
          </p>
          <label className="flex items-start gap-3 text-sm text-stone-800">
            <input
              type="checkbox"
              checked={policyAccepted}
              onChange={(event) => setPolicyAccepted(event.target.checked)}
              className="mt-1"
            />
            <span>I accept the Thuto Center upload & access policy ({CENTER_POLICY.version}).</span>
          </label>
          <label className="flex items-start gap-3 text-sm text-stone-800">
            <input
              type="checkbox"
              checked={copyrightDeclaration}
              onChange={(event) => setCopyrightDeclaration(event.target.checked)}
              className="mt-1"
            />
            <span>{CENTER_POLICY.declaration}</span>
          </label>
        </section>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">File (max {CENTER_MAX_FILE_BYTES / (1024 * 1024)} MB)</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Title</span>
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="e.g. MAT111 Calculus lecture notes — Semester 1"
            maxLength={160}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Description (optional)</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={3}
            maxLength={800}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-stone-700">Document type</span>
            <select
              value={form.documentType}
              onChange={(event) => setForm((prev) => ({ ...prev, documentType: event.target.value }))}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
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
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
              required
            >
              <option value="">Select institution</option>
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
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
              required
            >
              <option value="">Select faculty</option>
              {CENTER_FACULTIES.map((faculty) => (
                <option key={faculty} value={faculty}>
                  {faculty}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-stone-700">Course code</span>
            <input
              type="text"
              value={form.courseCode}
              onChange={(event) => setForm((prev) => ({ ...prev, courseCode: event.target.value }))}
              placeholder="e.g. CSC211"
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-stone-700">Academic year (optional)</span>
            <input
              type="text"
              value={form.academicYear}
              onChange={(event) => setForm((prev) => ({ ...prev, academicYear: event.target.value }))}
              placeholder="e.g. 2025"
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-stone-700">Exam session (optional)</span>
            <input
              type="text"
              value={form.examSession}
              onChange={(event) => setForm((prev) => ({ ...prev, examSession: event.target.value }))}
              placeholder="e.g. May/June 2024"
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
            />
          </label>
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}

        <button
          type="submit"
          disabled={!canUpload || busy}
          className="focus-ring min-h-11 w-full rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {busy ? "Uploading…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
