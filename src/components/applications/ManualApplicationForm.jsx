import { useEffect, useMemo, useState } from "react";
import { addManualApplication, SELF_MANAGED_STATUSES, applicationStatusLabel } from "../../lib/applications.js";
import { fetchUniversities } from "../../lib/universitiesData.js";

/**
 * Adds an application the student made before they found Thuto, or one Thuto never saw because
 * they applied from another device.
 *
 * @param {{ onSaved: () => void | Promise<void>, onCancel: () => void }} props
 */
export default function ManualApplicationForm({ onSaved, onCancel }) {
  const [universities, setUniversities] = useState([]);
  const [institutionId, setInstitutionId] = useState("");
  const [programmeName, setProgrammeName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("pending");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchUniversities()
      .then(({ list }) => {
        if (!cancelled) setUniversities(list);
      })
      .catch(() => {
        if (!cancelled) setUniversities([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => universities.find((uni) => uni.id === institutionId) || null,
    [universities, institutionId],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!institutionId) {
      setError("Choose the institution you applied to.");
      return;
    }
    setSaving(true);
    try {
      await addManualApplication({
        institutionId,
        institutionName: selected?.name || "",
        programmeName: programmeName.trim(),
        // A free-text date would break the deadline helpers, which expect YYYY-MM-DD.
        deadline: deadline || null,
        status,
        studentNote: note.trim(),
      });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this application.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <h2 className="font-display text-base font-semibold text-brand-900">Add an application</h2>
        <p className="mt-1 text-sm text-slate-600">
          Already applied somewhere? Add it here so everything sits in one list.
        </p>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Institution</span>
        <select
          required
          value={institutionId}
          onChange={(event) => setInstitutionId(event.target.value)}
          className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Select institution…</option>
          {universities.map((uni) => (
            <option key={uni.id} value={uni.id}>
              {uni.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Programme</span>
        <input
          value={programmeName}
          onChange={(event) => setProgrammeName(event.target.value)}
          maxLength={200}
          placeholder="e.g. Bachelor of Nursing Science"
          className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Deadline (optional)</span>
          <input
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm"
          >
            {SELF_MANAGED_STATUSES.map((value) => (
              <option key={value} value={value}>
                {applicationStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Note (optional)</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Reference number, who you spoke to, what is outstanding…"
          className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm"
        />
      </label>

      {error ? <p className="text-sm text-red-800">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="focus-ring rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add application"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="focus-ring rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
