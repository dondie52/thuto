import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { fetchUniversities } from "../lib/universitiesData.js";
import { fetchProgrammes, programmeBelongsToUniversity } from "../lib/programmesData.js";
import InstitutionVerificationBadge from "../components/InstitutionVerificationBadge.jsx";
import PartnerInsightsDashboard from "../components/partner/PartnerInsightsDashboard.jsx";
import { defaultCurrencyForCountry } from "../lib/marketLocales.js";
import {
  fetchInstitutionAnalytics,
  fetchInstitutionLeads,
  fetchInstitutionMemberships,
  fetchInstitutionPartner,
  saveInstitutionOverride,
  saveProgrammeOverrideForPartner,
  submitInstitutionClaim,
  summarizeInstitutionAnalytics,
  updateLeadStatus,
} from "../lib/partner.js";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "profile", label: "Institution" },
  { id: "links", label: "Links & portals" },
  { id: "staff", label: "Staff" },
  { id: "programmes", label: "Programmes" },
  { id: "leads", label: "Leads" },
  { id: "claim", label: "Claim profile" },
];

const EMPTY_RESOURCE = { title: "", category: "", url: "", format: "Web page", sourceLabel: "" };
const EMPTY_STAFF = { name: "", title: "", email: "", phone: "", department: "" };

function normalizeResourceRows(resources) {
  if (!Array.isArray(resources)) return [];
  return resources.map((r) => ({
    title: r?.title || "",
    category: r?.category || "",
    url: r?.url || "",
    format: r?.format || "Web page",
    sourceLabel: r?.sourceLabel || "",
  }));
}

function normalizeStaffRows(staff) {
  if (!Array.isArray(staff)) return [];
  return staff.map((s) => ({
    name: s?.name || "",
    title: s?.title || "",
    email: s?.email || "",
    phone: s?.phone || "",
    department: s?.department || "",
  }));
}

export default function Partner() {
  useDocumentTitle("University Partner Portal | Thuto");
  const { user, isLoading, isSuperuser } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [memberships, setMemberships] = useState([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const [partner, setPartner] = useState(null);
  const [university, setUniversity] = useState(null);
  const [programmes, setProgrammes] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [leads, setLeads] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [claimEmail, setClaimEmail] = useState("");
  const [claimInstitutionId, setClaimInstitutionId] = useState("");
  const [allUniversities, setAllUniversities] = useState([]);
  const [profileForm, setProfileForm] = useState({
    description: "",
    applicationOpen: "",
    applicationClose: "",
    applyUrl: "",
    website: "",
    phone: "",
    email: "",
  });
  const [resourceRows, setResourceRows] = useState([]);
  const [staffRows, setStaffRows] = useState([]);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState("");
  const [programmeForm, setProgrammeForm] = useState({
    description: "",
    applyUrl: "",
    officialUrl: "",
    applicationDeadline: "",
    feesDomestic: "",
    minPoints: "",
  });

  const activeInstitutionId = selectedInstitutionId || memberships[0]?.institution_id || "";

  const loadBase = useCallback(async () => {
    const [members, uniData, progData] = await Promise.all([
      fetchInstitutionMemberships(),
      fetchUniversities(),
      fetchProgrammes(),
    ]);
    setMemberships(members);
    setAllUniversities(uniData.list || []);
    setProgrammes(progData);
    if (!selectedInstitutionId && members[0]?.institution_id) {
      setSelectedInstitutionId(members[0].institution_id);
    }
  }, [selectedInstitutionId]);

  const loadInstitution = useCallback(async (institutionId) => {
    if (!institutionId) return;
    const [partnerRow, analyticsRows, leadRows, uniData] = await Promise.all([
      fetchInstitutionPartner(institutionId),
      fetchInstitutionAnalytics(institutionId, 30),
      fetchInstitutionLeads(institutionId),
      fetchUniversities(),
    ]);
    setPartner(partnerRow);
    setAnalytics(analyticsRows);
    setLeads(leadRows);
    const uni = (uniData.list || []).find((u) => u.id === institutionId);
    setUniversity(uni || null);
    if (uni) {
      setProfileForm({
        description: uni.description || "",
        applicationOpen: uni.applicationOpen || "",
        applicationClose: uni.applicationClose || "",
        applyUrl: uni.applyUrl || "",
        website: uni.website || "",
        phone: uni.phone || "",
        email: uni.email || "",
      });
      setResourceRows(normalizeResourceRows(uni.resources));
      setStaffRows(normalizeStaffRows(uni.staff));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadBase();
  }, [user, loadBase]);

  useEffect(() => {
    if (activeInstitutionId) loadInstitution(activeInstitutionId);
  }, [activeInstitutionId, loadInstitution]);

  const institutionProgrammes = useMemo(() => {
    if (!university) return [];
    return programmes.filter((p) => programmeBelongsToUniversity(p, university));
  }, [programmes, university]);

  const analyticsSummary = useMemo(
    () => summarizeInstitutionAnalytics(analytics, institutionProgrammes),
    [analytics, institutionProgrammes],
  );

  if (!isLoading && !user) {
    return <Navigate to="/auth?mode=login&next=/partner" replace />;
  }

  const hasAccess = memberships.length > 0 || isSuperuser;

  async function handleSaveProfile() {
    setError("");
    setMessage("");
    try {
      await saveInstitutionOverride(activeInstitutionId, {
        description: profileForm.description,
        applicationOpen: profileForm.applicationOpen || null,
        applicationClose: profileForm.applicationClose || null,
        applyUrl: profileForm.applyUrl || null,
        website: profileForm.website || null,
        phone: profileForm.phone || null,
        email: profileForm.email || null,
      });
      setMessage("Institution profile saved and published.");
      await loadInstitution(activeInstitutionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  async function handleSaveLinks() {
    setError("");
    setMessage("");
    try {
      const resources = resourceRows
        .map((row) => ({
          title: row.title.trim(),
          category: row.category.trim(),
          url: row.url.trim(),
          format: row.format.trim() || "Web page",
          sourceLabel: row.sourceLabel.trim() || university?.name || "",
        }))
        .filter((row) => row.title && row.url);
      await saveInstitutionOverride(activeInstitutionId, {
        website: profileForm.website || null,
        applyUrl: profileForm.applyUrl || null,
        resources,
      });
      setMessage("Links and portals saved and published.");
      await loadInstitution(activeInstitutionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  async function handleSaveStaff() {
    setError("");
    setMessage("");
    try {
      const staff = staffRows
        .map((row) => ({
          name: row.name.trim(),
          title: row.title.trim(),
          email: row.email.trim(),
          phone: row.phone.trim(),
          department: row.department.trim(),
        }))
        .filter((row) => row.name);
      await saveInstitutionOverride(activeInstitutionId, { staff });
      setMessage("Staff contacts saved and published.");
      await loadInstitution(activeInstitutionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  async function handleSaveProgramme() {
    if (!selectedProgrammeId) return;
    setError("");
    setMessage("");
    try {
      const patch = {
        description: programmeForm.description || null,
        applyUrl: programmeForm.applyUrl || null,
        officialUrl: programmeForm.officialUrl || null,
        applicationDeadline: programmeForm.applicationDeadline || null,
      };
      if (programmeForm.feesDomestic) {
        patch.fees = {
          domestic: Number(programmeForm.feesDomestic),
          currency: defaultCurrencyForCountry(university?.country),
        };
      }
      if (programmeForm.minPoints) {
        patch.minPoints = Number(programmeForm.minPoints);
      }
      await saveProgrammeOverrideForPartner(selectedProgrammeId, activeInstitutionId, patch);
      setMessage("Programme updated.");
      await loadBase();
      await loadInstitution(activeInstitutionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  async function handleClaim() {
    setError("");
    setMessage("");
    try {
      await submitInstitutionClaim({
        institutionId: claimInstitutionId,
        workEmail: claimEmail,
      });
      setMessage("Claim submitted. Thuto will verify your official email domain.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed.");
    }
  }

  function fillProgrammeForm(programmeId) {
    setSelectedProgrammeId(programmeId);
    const p = institutionProgrammes.find((row) => row.id === programmeId);
    if (!p) return;
    setProgrammeForm({
      description: p.description || "",
      applyUrl: p.applyUrl || "",
      officialUrl: p.officialUrl || "",
      applicationDeadline: p.applicationDeadline?.slice(0, 10) || "",
      feesDomestic: p.fees?.domestic != null ? String(p.fees.domestic) : "",
      minPoints: p.minPoints != null ? String(p.minPoints) : "",
    });
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Institution partner portal</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-brand-900 sm:text-3xl">
              {university?.name || "Your institution dashboard"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Analytics modules inspired by recruitment insight dashboards — plus tools to manage programmes, staff, and
              official links. Students never see this view.
            </p>
          </div>
          {partner?.verified_at ? <InstitutionVerificationBadge /> : null}
        </div>
      </header>

      {!hasAccess ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-900">Claim your institution</h2>
          <p className="mt-2 text-sm text-slate-600">
            No partner access yet. Submit a claim with your official work email (e.g. @ub.bw).
          </p>
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="font-medium">Institution</span>
              <select
                value={claimInstitutionId}
                onChange={(e) => setClaimInstitutionId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
              >
                <option value="">Select institution</option>
                {allUniversities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium">Official work email</span>
              <input
                type="email"
                value={claimEmail}
                onChange={(e) => setClaimEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={handleClaim}
              className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Submit claim
            </button>
          </div>
        </section>
      ) : (
        <>
          {memberships.length > 1 ? (
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Institution</span>
              <select
                value={activeInstitutionId}
                onChange={(e) => setSelectedInstitutionId(e.target.value)}
                className="mt-1 rounded-lg border border-brand-200 px-3 py-2"
              >
                {memberships.map((m) => (
                  <option key={m.institution_id} value={m.institution_id}>
                    {m.institution_id} ({m.role})
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <nav className="flex flex-wrap gap-2">
            {TABS.filter((t) => (hasAccess ? t.id !== "claim" : t.id === "claim")).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  tab === item.id ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-800",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p> : null}
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

          {tab === "dashboard" ? (
            <PartnerInsightsDashboard
              universityName={university?.name || activeInstitutionId}
              programmeCount={institutionProgrammes.length}
              tier={partner?.tier || "verified"}
              newLeads={leads.filter((l) => l.status === "new").length}
              summary={analyticsSummary}
              onOpenModule={setTab}
            />
          ) : null}

          {tab === "profile" ? (
            <section className="space-y-3 rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-brand-900">
                {university?.name || activeInstitutionId}
              </h2>
              <textarea
                value={profileForm.description}
                onChange={(e) => setProfileForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                placeholder="Institution description"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-600">
                  Application opens
                  <input
                    type="date"
                    value={profileForm.applicationOpen}
                    onChange={(e) => setProfileForm((f) => ({ ...f, applicationOpen: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Application closes
                  <input
                    type="date"
                    value={profileForm.applicationClose}
                    onChange={(e) => setProfileForm((f) => ({ ...f, applicationClose: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <input
                value={profileForm.website}
                onChange={(e) => setProfileForm((f) => ({ ...f, website: e.target.value }))}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                placeholder="Official website URL"
              />
              <input
                value={profileForm.applyUrl}
                onChange={(e) => setProfileForm((f) => ({ ...f, applyUrl: e.target.value }))}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                placeholder="Apply / admissions portal URL"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                  placeholder="Phone"
                />
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                  placeholder="Public contact email"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Publish changes
              </button>
            </section>
          ) : null}

          {tab === "links" ? (
            <section className="space-y-4 rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-display text-lg font-semibold text-brand-900">Website & portals</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Students see these on your institution page. Use absolute https links only.
                </p>
              </div>
              <input
                value={profileForm.website}
                onChange={(e) => setProfileForm((f) => ({ ...f, website: e.target.value }))}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                placeholder="Official website URL"
              />
              <input
                value={profileForm.applyUrl}
                onChange={(e) => setProfileForm((f) => ({ ...f, applyUrl: e.target.value }))}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                placeholder="Apply / admissions portal URL"
              />
              <div className="space-y-3 border-t border-brand-100 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-brand-900">Resource links</h3>
                  <button
                    type="button"
                    onClick={() => setResourceRows((rows) => [...rows, { ...EMPTY_RESOURCE }])}
                    className="rounded-lg border border-brand-200 px-2 py-1 text-xs font-semibold text-brand-800"
                  >
                    Add link
                  </button>
                </div>
                {resourceRows.map((row, index) => (
                  <div key={`resource-${index}`} className="space-y-2 rounded-xl border border-brand-100 bg-brand-50/40 p-3">
                    <input
                      value={row.title}
                      onChange={(e) =>
                        setResourceRows((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, title: e.target.value } : r)),
                        )
                      }
                      className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                      placeholder="Title"
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={row.category}
                        onChange={(e) =>
                          setResourceRows((rows) =>
                            rows.map((r, i) => (i === index ? { ...r, category: e.target.value } : r)),
                          )
                        }
                        className="rounded-lg border border-brand-200 px-3 py-2 text-sm"
                        placeholder="Category"
                      />
                      <input
                        value={row.format}
                        onChange={(e) =>
                          setResourceRows((rows) =>
                            rows.map((r, i) => (i === index ? { ...r, format: e.target.value } : r)),
                          )
                        }
                        className="rounded-lg border border-brand-200 px-3 py-2 text-sm"
                        placeholder="Format (PDF, Web page…)"
                      />
                    </div>
                    <input
                      value={row.url}
                      onChange={(e) =>
                        setResourceRows((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, url: e.target.value } : r)),
                        )
                      }
                      className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                      placeholder="https://…"
                    />
                    <button
                      type="button"
                      onClick={() => setResourceRows((rows) => rows.filter((_, i) => i !== index))}
                      className="text-xs font-semibold text-red-700 underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {!resourceRows.length ? <p className="text-sm text-slate-500">No resource links yet.</p> : null}
              </div>
              <button
                type="button"
                onClick={handleSaveLinks}
                className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Publish links
              </button>
            </section>
          ) : null}

          {tab === "staff" ? (
            <section className="space-y-4 rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-semibold text-brand-900">Staff contacts</h2>
                  <p className="mt-1 text-sm text-slate-600">Shown on your public institution page for student enquiries.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStaffRows((rows) => [...rows, { ...EMPTY_STAFF }])}
                  className="rounded-lg border border-brand-200 px-2 py-1 text-xs font-semibold text-brand-800"
                >
                  Add person
                </button>
              </div>
              {staffRows.map((row, index) => (
                <div key={`staff-${index}`} className="space-y-2 rounded-xl border border-brand-100 bg-brand-50/40 p-3">
                  <input
                    value={row.name}
                    onChange={(e) =>
                      setStaffRows((rows) => rows.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)))
                    }
                    className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                    placeholder="Full name"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={row.title}
                      onChange={(e) =>
                        setStaffRows((rows) => rows.map((r, i) => (i === index ? { ...r, title: e.target.value } : r)))
                      }
                      className="rounded-lg border border-brand-200 px-3 py-2 text-sm"
                      placeholder="Title / role"
                    />
                    <input
                      value={row.department}
                      onChange={(e) =>
                        setStaffRows((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, department: e.target.value } : r)),
                        )
                      }
                      className="rounded-lg border border-brand-200 px-3 py-2 text-sm"
                      placeholder="Department"
                    />
                    <input
                      type="email"
                      value={row.email}
                      onChange={(e) =>
                        setStaffRows((rows) => rows.map((r, i) => (i === index ? { ...r, email: e.target.value } : r)))
                      }
                      className="rounded-lg border border-brand-200 px-3 py-2 text-sm"
                      placeholder="Email"
                    />
                    <input
                      value={row.phone}
                      onChange={(e) =>
                        setStaffRows((rows) => rows.map((r, i) => (i === index ? { ...r, phone: e.target.value } : r)))
                      }
                      className="rounded-lg border border-brand-200 px-3 py-2 text-sm"
                      placeholder="Phone"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setStaffRows((rows) => rows.filter((_, i) => i !== index))}
                    className="text-xs font-semibold text-red-700 underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {!staffRows.length ? <p className="text-sm text-slate-500">No staff contacts yet.</p> : null}
              <button
                type="button"
                onClick={handleSaveStaff}
                className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Publish staff
              </button>
            </section>
          ) : null}

          {tab === "programmes" ? (
            <section className="space-y-3 rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-brand-900">Programme information</h2>
              <select
                value={selectedProgrammeId}
                onChange={(e) => fillProgrammeForm(e.target.value)}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
              >
                <option value="">Select programme</option>
                {institutionProgrammes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {selectedProgrammeId ? (
                <>
                  <textarea
                    value={programmeForm.description}
                    onChange={(e) => setProgrammeForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                    placeholder="Programme description"
                  />
                  <input
                    value={programmeForm.applyUrl}
                    onChange={(e) => setProgrammeForm((f) => ({ ...f, applyUrl: e.target.value }))}
                    className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                    placeholder="Apply URL"
                  />
                  <input
                    value={programmeForm.officialUrl}
                    onChange={(e) => setProgrammeForm((f) => ({ ...f, officialUrl: e.target.value }))}
                    className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                    placeholder="Official programme page URL"
                  />
                  <input
                    type="date"
                    value={programmeForm.applicationDeadline}
                    onChange={(e) => setProgrammeForm((f) => ({ ...f, applicationDeadline: e.target.value }))}
                    className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={programmeForm.minPoints}
                    onChange={(e) => setProgrammeForm((f) => ({ ...f, minPoints: e.target.value }))}
                    className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                    placeholder="Minimum points"
                  />
                  <input
                    value={programmeForm.feesDomestic}
                    onChange={(e) => setProgrammeForm((f) => ({ ...f, feesDomestic: e.target.value }))}
                    className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                    placeholder={`Domestic fees (${defaultCurrencyForCountry(university?.country)})`}
                  />
                  <button
                    type="button"
                    onClick={handleSaveProgramme}
                    className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                  >
                    Update programme
                  </button>
                </>
              ) : null}
            </section>
          ) : null}

          {tab === "leads" ? (
            <section className="space-y-3">
              {leads.map((lead) => (
                <article key={lead.id} className="rounded-xl border border-brand-200 bg-white p-4 text-sm shadow-sm">
                  <p className="font-semibold text-brand-900">{lead.lead_type}</p>
                  <p className="text-xs text-slate-500">{new Date(lead.created_at).toLocaleString()}</p>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">
                    {JSON.stringify(lead.payload, null, 2)}
                  </pre>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateLeadStatus(lead.id, "contacted").then(() => loadInstitution(activeInstitutionId))}
                      className="rounded-lg border border-brand-200 px-2 py-1 text-xs font-semibold"
                    >
                      Mark contacted
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLeadStatus(lead.id, "archived").then(() => loadInstitution(activeInstitutionId))}
                      className="rounded-lg border border-brand-200 px-2 py-1 text-xs font-semibold"
                    >
                      Archive
                    </button>
                  </div>
                </article>
              ))}
              {!leads.length ? <p className="text-sm text-slate-500">No leads yet.</p> : null}
            </section>
          ) : null}
        </>
      )}

      <Link to="/app" className="text-sm font-semibold text-brand-800 underline">
        ← Back to Thuto
      </Link>
    </div>
  );
}

