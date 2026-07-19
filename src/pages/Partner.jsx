import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { fetchUniversities } from "../lib/universitiesData.js";
import { fetchProgrammes, programmeBelongsToUniversity } from "../lib/programmesData.js";
import InstitutionVerificationBadge from "../components/InstitutionVerificationBadge.jsx";
import { defaultCurrencyForCountry } from "../lib/marketLocales.js";
import {
  fetchInstitutionAnalytics,
  fetchInstitutionLeads,
  fetchInstitutionMemberships,
  fetchInstitutionPartner,
  saveInstitutionOverride,
  saveProgrammeOverrideForPartner,
  submitInstitutionClaim,
  updateLeadStatus,
} from "../lib/partner.js";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "profile", label: "Institution" },
  { id: "programmes", label: "Programmes" },
  { id: "analytics", label: "Analytics" },
  { id: "leads", label: "Leads" },
  { id: "claim", label: "Claim profile" },
];

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
    phone: "",
  });
  const [selectedProgrammeId, setSelectedProgrammeId] = useState("");
  const [programmeForm, setProgrammeForm] = useState({
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
        phone: uni.phone || "",
      });
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

  const analyticsTotals = useMemo(() => {
    const totals = {};
    for (const row of analytics) {
      totals[row.event_name] = (totals[row.event_name] || 0) + row.count;
    }
    return totals;
  }, [analytics]);

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
        phone: profileForm.phone || null,
      });
      setMessage("Institution profile saved and published.");
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

  return (
    <div className="space-y-6 pb-24">
      <header className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">University Partner Portal</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand-900">Manage your institution on Thuto</h1>
        <p className="mt-2 text-sm text-slate-600">
          Update profiles, track student interest, and manage verified listings.
        </p>
        {partner?.verified_at ? (
          <div className="mt-3">
            <InstitutionVerificationBadge />
          </div>
        ) : null}
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
            <section className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Programmes listed" value={institutionProgrammes.length} />
              <StatCard label="Profile views (30d)" value={analyticsTotals.institution_profile_view || 0} />
              <StatCard label="Apply clicks (30d)" value={analyticsTotals.apply_click || 0} />
              <StatCard label="New leads" value={leads.filter((l) => l.status === "new").length} />
              <StatCard label="Partner tier" value={partner?.tier || "verified"} />
            </section>
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
                <input
                  type="date"
                  value={profileForm.applicationOpen}
                  onChange={(e) => setProfileForm((f) => ({ ...f, applicationOpen: e.target.value }))}
                  className="rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={profileForm.applicationClose}
                  onChange={(e) => setProfileForm((f) => ({ ...f, applicationClose: e.target.value }))}
                  className="rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>
              <input
                value={profileForm.applyUrl}
                onChange={(e) => setProfileForm((f) => ({ ...f, applyUrl: e.target.value }))}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                placeholder="Apply URL"
              />
              <input
                value={profileForm.phone}
                onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                placeholder="Phone"
              />
              <button
                type="button"
                onClick={handleSaveProfile}
                className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Publish changes
              </button>
            </section>
          ) : null}

          {tab === "programmes" ? (
            <section className="space-y-3 rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
              <select
                value={selectedProgrammeId}
                onChange={(e) => {
                  setSelectedProgrammeId(e.target.value);
                  const p = institutionProgrammes.find((row) => row.id === e.target.value);
                  if (p) {
                    setProgrammeForm({
                      applicationDeadline: p.applicationDeadline?.slice(0, 10) || "",
                      feesDomestic: p.fees?.domestic != null ? String(p.fees.domestic) : "",
                      minPoints: p.minPoints != null ? String(p.minPoints) : "",
                    });
                  }
                }}
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

          {tab === "analytics" ? (
            <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-brand-900">Last 30 days</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {Object.entries(analyticsTotals).map(([name, count]) => (
                  <li key={name} className="flex justify-between border-b border-brand-50 py-2">
                    <span className="text-slate-700">{name.replace(/_/g, " ")}</span>
                    <span className="font-semibold text-brand-900">{count}</span>
                  </li>
                ))}
                {!Object.keys(analyticsTotals).length ? (
                  <li className="text-slate-500">No analytics yet — views and apply clicks will appear here.</li>
                ) : null}
              </ul>
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

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-brand-900">{value}</p>
    </div>
  );
}
