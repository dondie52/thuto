import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthProvider, useAuth } from "../lib/auth.jsx";
import { Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { thutoLogoSrc } from "../components/BrandMark.jsx";
import InstitutionVerificationBadge from "../components/InstitutionVerificationBadge.jsx";
import PartnerInsightsDashboard from "../components/partner/PartnerInsightsDashboard.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
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
import { fetchProgrammes, programmeBelongsToUniversity } from "../lib/programmesData.js";
import { fetchUniversities } from "../lib/universitiesData.js";
import {
  UNIVERSITY_SOCIAL_PLATFORMS,
  normalizeUniversityAccreditation,
  normalizeUniversityCampusPhotos,
  normalizeUniversityContacts,
  normalizeUniversitySocialLinks,
  normalizeUniversityStudentLife,
  splitMultilineList,
  summarizeUniversityProfileCompleteness,
} from "../lib/institutionProfile.js";
import { STUDENT_INCENTIVE_CATEGORY_META } from "../lib/studentIncentives.js";
import { buildAppUrl } from "../lib/cmsUrl.js";

const NAV_ITEMS = [
  { to: "/", end: true, label: "Home", icon: "home" },
  { to: "/profile", label: "Profile", icon: "profile" },
  { to: "/staff", label: "Staff", icon: "staff" },
  { to: "/programmes", label: "Programmes", icon: "programmes" },
  { to: "/analytics", label: "Data and Analytics", icon: "analytics" },
  { to: "/feed", label: "Feed", icon: "feed" },
  { to: "/faq", label: "FAQ", icon: "faq" },
];

const EMPTY_RESOURCE = { title: "", category: "", url: "", format: "Web page", sourceLabel: "" };
const EMPTY_STAFF = { name: "", title: "", email: "", phone: "", department: "" };
const EMPTY_INCENTIVE = { category: "other", label: "", detail: "", sourceUrl: "", sourceLabel: "" };
const EMPTY_PROGRAMME_FORM = {
  description: "",
  applyUrl: "",
  officialUrl: "",
  applicationDeadline: "",
  feesDomestic: "",
  minPoints: "",
  accreditationStatus: "",
  accreditationBody: "",
  accreditationNotes: "",
  careers: "",
  jobOpportunities: "",
};

function normalizeResourceRows(resources) {
  if (!Array.isArray(resources)) return [];
  return resources.map((row) => ({
    title: row?.title || "",
    category: row?.category || "",
    url: row?.url || "",
    format: row?.format || "Web page",
    sourceLabel: row?.sourceLabel || "",
  }));
}

function normalizeStaffRows(staff) {
  if (!Array.isArray(staff)) return [];
  return staff.map((row) => ({
    name: row?.name || "",
    title: row?.title || "",
    email: row?.email || "",
    phone: row?.phone || "",
    department: row?.department || "",
  }));
}

function formatCount(value) {
  return new Intl.NumberFormat().format(Math.max(0, Number(value) || 0));
}

function formatShortDate(value) {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function iconGlyph(name) {
  const glyphs = {
    home: "⌂",
    profile: "◫",
    staff: "◌",
    programmes: "≣",
    analytics: "▥",
    feed: "✦",
    faq: "?",
  };
  return glyphs[name] || "•";
}

function buildMockDashboard(university, summary, institutionProgrammes, leads, analyticsRows) {
  const programmeViews = summary.totals.programme_view || 0;
  const profileViews = summary.totals.institution_profile_view || 0;
  const applyClicks = summary.totals.apply_click || 0;
  const outboundClicks = summary.outboundClicks || 0;
  const totalLeads = leads.length;
  const newLeads = leads.filter((lead) => lead.status === "new").length;
  const chartByDate = new Map();
  for (const row of analyticsRows || []) {
    if (row.event_name !== "programme_view") continue;
    chartByDate.set(row.event_date, (chartByDate.get(row.event_date) || 0) + (Number(row.count) || 0));
  }
  const weekSeries = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    const key = day.toISOString().slice(0, 10);
    const fallback = 260 + index * 54;
    return {
      key,
      label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: chartByDate.get(key) || fallback,
    };
  });
  const maxSeriesValue = Math.max(...weekSeries.map((row) => row.value), 1);
  const topProgrammes =
    summary.topProgrammes.slice(0, 5).map((row) => ({ label: row.label || row.id, count: row.count })) ||
    [];
  const topCountries = summary.topCountries.slice(0, 6);
  const deadlines = [
    university?.applicationClose
      ? {
          title: `${university?.shortName || university?.name || "Institution"} admissions`,
          date: university.applicationClose,
          detail: "Institution application deadline",
        }
      : null,
    ...institutionProgrammes
      .filter((programme) => programme.applicationDeadline)
      .map((programme) => ({
        title: programme.name,
        date: programme.applicationDeadline,
        detail: "Programme deadline",
      })),
  ]
    .filter(Boolean)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  const recentActivity = [
    ...leads.slice(0, 3).map((lead) => ({
      title: "New lead received",
      detail: lead.programme_id ? `Interest captured for ${lead.programme_id}` : "A student submitted an enquiry",
      when: lead.created_at,
    })),
    {
      title: "Programme content refreshed",
      detail: "Keep flagship programmes current before the next intake window.",
      when: new Date().toISOString(),
    },
    {
      title: "Staff directory reviewed",
      detail: "Students can contact verified admissions staff directly.",
      when: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
    },
  ].slice(0, 5);

  const latestReviews = [
    {
      name: "Student review sample",
      quote: "Demo review data will be replaced when the reviews module goes live.",
      rating: 5,
      when: "Demo",
    },
    {
      name: "Parent feedback sample",
      quote: "Use this area to spot themes in accommodation, academics, and support.",
      rating: 4,
      when: "Demo",
    },
  ];

  const metrics = [
    { label: "Programme views", value: programmeViews || 43021, trend: "+12.5%", live: Boolean(programmeViews) },
    { label: "Profile views", value: profileViews || 1245, trend: "+8.2%", live: Boolean(profileViews) },
    { label: "Leads generated", value: totalLeads || 562, trend: `${newLeads} new`, live: Boolean(totalLeads) },
    { label: "Applications started", value: applyClicks || 317, trend: "+5.1%", live: Boolean(applyClicks) },
    { label: "Feed engagement", value: outboundClicks || 188, trend: "Demo", live: Boolean(outboundClicks) },
    { label: "New reviews", value: 8, trend: "Demo", live: false },
    { label: "New questions", value: 17, trend: "Demo", live: false },
  ];

  const aiInsights = [
    topProgrammes[0]
      ? `${topProgrammes[0].label} is drawing the most attention in the dashboard right now.`
      : "Top programme insight will appear once live view data is available.",
    deadlines[0]
      ? `${deadlines[0].title} is the nearest application deadline to highlight in student messaging.`
      : "No imminent deadlines are configured yet, so students may miss urgency cues.",
    totalLeads
      ? `${newLeads} fresh leads still need follow-up from your admissions team.`
      : "Lead capture is enabled, but the dashboard is still showing mostly demo funnel data.",
  ];

  return {
    metrics,
    weekSeries,
    maxSeriesValue,
    topProgrammes: topProgrammes.length
      ? topProgrammes
      : [
          { label: "BSc Computer Science", count: 7842 },
          { label: "BSc Nursing", count: 4823 },
          { label: "LLB", count: 3210 },
        ],
    topCountries: topCountries.length
      ? topCountries
      : [
          { id: "botswana", count: 286 },
          { id: "south-africa", count: 124 },
          { id: "kenya", count: 96 },
          { id: "ghana", count: 72 },
        ],
    deadlines,
    recentActivity,
    latestReviews,
    aiInsights,
    quickActions: [
      { label: "Add Programme", to: "/programmes" },
      { label: "Create Feed Post", to: "/feed" },
      { label: "Invite Staff", to: "/staff" },
      { label: "Edit Institution Profile", to: "/profile" },
      { label: "View Analytics", to: "/analytics" },
    ],
  };
}

function usePartnerPortalData() {
  const { user, isLoading, isSuperuser, logout } = useAuth();
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
    logo: "",
    universityType: "",
    physicalAddress: "",
    generalPhone: "",
    admissionsPhone: "",
    generalEmail: "",
    admissionsEmail: "",
    accreditationStatus: "",
    accreditationBody: "",
    accreditationNotes: "",
    accreditationSourceUrl: "",
    accommodationStatus: "",
    accommodationDetails: "",
    healthDetails: "",
    safetyDetails: "",
    sportsDetails: "",
    careerSupportDetails: "",
    campusPhotosText: "",
    socialFacebook: "",
    socialInstagram: "",
    socialX: "",
    socialLinkedin: "",
    socialYoutube: "",
    socialTiktok: "",
  });
  const [resourceRows, setResourceRows] = useState([]);
  const [staffRows, setStaffRows] = useState([]);
  const [studentLifeRows, setStudentLifeRows] = useState([]);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState("");
  const [programmeForm, setProgrammeForm] = useState(EMPTY_PROGRAMME_FORM);

  const activeInstitutionId = selectedInstitutionId || memberships[0]?.institution_id || "";

  const loadBase = useCallback(async () => {
    const [members, universityData, programmeData] = await Promise.all([
      fetchInstitutionMemberships(),
      fetchUniversities(),
      fetchProgrammes(),
    ]);
    setMemberships(members);
    setAllUniversities(universityData.list || []);
    setProgrammes(programmeData);
    if (!selectedInstitutionId && members[0]?.institution_id) {
      setSelectedInstitutionId(members[0].institution_id);
    }
  }, [selectedInstitutionId]);

  const loadInstitution = useCallback(async (institutionId) => {
    if (!institutionId) return;
    const [partnerRow, analyticsRows, leadRows, universityData] = await Promise.all([
      fetchInstitutionPartner(institutionId),
      fetchInstitutionAnalytics(institutionId, 30),
      fetchInstitutionLeads(institutionId),
      fetchUniversities(),
    ]);
    setPartner(partnerRow);
    setAnalytics(analyticsRows);
    setLeads(leadRows);
    const uni = (universityData.list || []).find((row) => row.id === institutionId);
    setUniversity(uni || null);
    if (uni) {
      const contacts = normalizeUniversityContacts(uni);
      const accreditation = normalizeUniversityAccreditation(uni);
      const studentLife = normalizeUniversityStudentLife(uni);
      const socialLinks = normalizeUniversitySocialLinks(uni);
      setProfileForm({
        description: uni.description || "",
        applicationOpen: uni.applicationOpen || "",
        applicationClose: uni.applicationClose || "",
        applyUrl: uni.applyUrl || "",
        website: uni.website || "",
        logo: uni.logo || "",
        universityType: uni.universityType || uni.type || "",
        physicalAddress: contacts.address,
        generalPhone: contacts.generalPhone,
        admissionsPhone: contacts.admissionsPhone,
        generalEmail: contacts.generalEmail,
        admissionsEmail: contacts.admissionsEmail,
        accreditationStatus: accreditation.status,
        accreditationBody: accreditation.body,
        accreditationNotes: accreditation.notes,
        accreditationSourceUrl: accreditation.sourceUrl,
        accommodationStatus: studentLife.accommodationStatus,
        accommodationDetails: studentLife.accommodationDetails,
        healthDetails: studentLife.healthDetails,
        safetyDetails: studentLife.safetyDetails,
        sportsDetails: studentLife.sportsDetails,
        careerSupportDetails: studentLife.careerSupportDetails,
        campusPhotosText: normalizeUniversityCampusPhotos(uni).join("\n"),
        socialFacebook: socialLinks.facebook,
        socialInstagram: socialLinks.instagram,
        socialX: socialLinks.x,
        socialLinkedin: socialLinks.linkedin,
        socialYoutube: socialLinks.youtube,
        socialTiktok: socialLinks.tiktok,
      });
      setResourceRows(normalizeResourceRows(uni.resources));
      setStaffRows(normalizeStaffRows(uni.staff));
      setStudentLifeRows(
        (Array.isArray(uni.studentIncentives) ? uni.studentIncentives : []).map((item) => ({
          category: item?.category || "other",
          label: item?.label || "",
          detail: item?.detail || "",
          sourceUrl: item?.sourceUrl || "",
          sourceLabel: item?.sourceLabel || "",
        })),
      );
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
    return programmes.filter((programme) => programmeBelongsToUniversity(programme, university));
  }, [programmes, university]);

  const analyticsSummary = useMemo(
    () => summarizeInstitutionAnalytics(analytics, institutionProgrammes),
    [analytics, institutionProgrammes],
  );

  const profileCompleteness = useMemo(
    () => summarizeUniversityProfileCompleteness(university, institutionProgrammes.length),
    [university, institutionProgrammes.length],
  );

  const dashboard = useMemo(
    () => buildMockDashboard(university, analyticsSummary, institutionProgrammes, leads, analytics),
    [analytics, analyticsSummary, institutionProgrammes, leads, university],
  );

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
        logo: profileForm.logo || null,
        universityType: profileForm.universityType || null,
        physicalAddress: profileForm.physicalAddress || null,
        generalPhone: profileForm.generalPhone || null,
        admissionsPhone: profileForm.admissionsPhone || null,
        generalEmail: profileForm.generalEmail || null,
        admissionsEmail: profileForm.admissionsEmail || null,
        phone: profileForm.generalPhone || null,
        email: profileForm.generalEmail || null,
        accreditationStatus: profileForm.accreditationStatus || null,
        accreditationBody: profileForm.accreditationBody || null,
        accreditationNotes: profileForm.accreditationNotes || null,
        accreditationSourceUrl: profileForm.accreditationSourceUrl || null,
        accommodationStatus: profileForm.accommodationStatus || null,
        accommodationDetails: profileForm.accommodationDetails || null,
        healthDetails: profileForm.healthDetails || null,
        safetyDetails: profileForm.safetyDetails || null,
        sportsDetails: profileForm.sportsDetails || null,
        careerSupportDetails: profileForm.careerSupportDetails || null,
        studentIncentives: studentLifeRows
          .map((row) => ({
            category: row.category || "other",
            label: row.label.trim(),
            detail: row.detail.trim(),
            sourceUrl: row.sourceUrl.trim(),
            sourceLabel: row.sourceLabel.trim(),
          }))
          .filter((row) => row.label),
        socialLinks: {
          facebook: profileForm.socialFacebook || null,
          instagram: profileForm.socialInstagram || null,
          x: profileForm.socialX || null,
          linkedin: profileForm.socialLinkedin || null,
          youtube: profileForm.socialYoutube || null,
          tiktok: profileForm.socialTiktok || null,
        },
        campusPhotos: splitMultilineList(profileForm.campusPhotosText),
        campusPhoto: splitMultilineList(profileForm.campusPhotosText)[0] || null,
        resources: resourceRows
          .map((row) => ({
            title: row.title.trim(),
            category: row.category.trim(),
            url: row.url.trim(),
            format: row.format.trim() || "Web page",
            sourceLabel: row.sourceLabel.trim() || university?.name || "",
          }))
          .filter((row) => row.title && row.url),
      });
      setMessage("Institution profile saved and published.");
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
        accreditationStatus: programmeForm.accreditationStatus || null,
        accreditationBody: programmeForm.accreditationBody || null,
        accreditationNotes: programmeForm.accreditationNotes || null,
        careers: splitMultilineList(programmeForm.careers),
        careerOpportunities: splitMultilineList(programmeForm.careers),
        jobOpportunities: splitMultilineList(programmeForm.jobOpportunities),
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
    const programme = institutionProgrammes.find((row) => row.id === programmeId);
    if (!programme) {
      setProgrammeForm(EMPTY_PROGRAMME_FORM);
      return;
    }
    setProgrammeForm({
      description: programme.description || "",
      applyUrl: programme.applyUrl || "",
      officialUrl: programme.officialUrl || "",
      applicationDeadline: programme.applicationDeadline?.slice(0, 10) || "",
      feesDomestic: programme.fees?.domestic != null ? String(programme.fees.domestic) : "",
      minPoints: programme.minPoints != null ? String(programme.minPoints) : "",
      accreditationStatus: programme.accreditationStatus || "",
      accreditationBody: programme.accreditationBody || "",
      accreditationNotes: programme.accreditationNotes || "",
      careers: [...new Set([...(programme.careers || []), ...(programme.careerOpportunities || [])])].join("\n"),
      jobOpportunities: (programme.jobOpportunities || []).join("\n"),
    });
  }

  return {
    user,
    isLoading,
    logout,
    memberships,
    activeInstitutionId,
    selectedInstitutionId,
    setSelectedInstitutionId,
    partner,
    university,
    programmes,
    analytics,
    leads,
    message,
    setMessage,
    error,
    setError,
    claimEmail,
    setClaimEmail,
    claimInstitutionId,
    setClaimInstitutionId,
    allUniversities,
    profileForm,
    setProfileForm,
    resourceRows,
    setResourceRows,
    staffRows,
    setStaffRows,
    studentLifeRows,
    setStudentLifeRows,
    selectedProgrammeId,
    programmeForm,
    setProgrammeForm,
    fillProgrammeForm,
    hasAccess,
    institutionProgrammes,
    analyticsSummary,
    profileCompleteness,
    dashboard,
    handleSaveProfile,
    handleSaveStaff,
    handleSaveProgramme,
    handleClaim,
    loadInstitution,
    updateLeadStatus,
  };
}

function usePortal() {
  return useOutletContext();
}

function CmsShell() {
  const portal = usePartnerPortalData();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (portal.isLoading || !portal.user) return;
    if (!portal.hasAccess && location.pathname !== "/claim") {
      navigate("/claim", { replace: true });
    }
    if (portal.hasAccess && location.pathname === "/claim") {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate, portal.hasAccess, portal.isLoading, portal.user]);

  if (!portal.isLoading && !portal.user) {
    return <CmsLoginPrompt />;
  }

  return (
    <div className="min-h-dvh bg-[#f5f7f5] text-slate-900 lg:grid lg:grid-cols-[290px_minmax(0,1fr)]">
      <aside className="flex min-h-full flex-col border-r border-white/10 bg-brand-950 text-white">
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <img src={thutoLogoSrc} alt="" className="h-11 w-11 rounded-2xl bg-white/10 p-1.5" />
            <div>
              <p className="font-display text-xl font-semibold tracking-tight text-white">Thuto</p>
              <p className="text-sm text-white/70">Institution Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "focus-ring-on-dark flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive ? "bg-emerald-500/20 text-white shadow-lg" : "text-white/80 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-sm">{iconGlyph(item.icon)}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="space-y-4 px-4 pb-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Need help?</p>
            <p className="mt-1 text-sm leading-relaxed text-white/70">
              Use the dashboard to keep your institution profile, deadlines, and leads aligned with what students see.
            </p>
            <a
              href={buildAppUrl("/support")}
              className="mt-4 inline-flex rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              Get support
            </a>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">{portal.university?.name || "Institution account"}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/60">
              {portal.memberships.find((item) => item.institution_id === portal.activeInstitutionId)?.role || "editor"}
            </p>
            {portal.memberships.length > 1 ? (
              <select
                value={portal.activeInstitutionId}
                onChange={(event) => portal.setSelectedInstitutionId(event.target.value)}
                className="mt-3 w-full rounded-xl border border-white/10 bg-brand-900 px-3 py-2 text-sm text-white"
              >
                {portal.memberships.map((membership) => (
                  <option key={membership.institution_id} value={membership.institution_id}>
                    {membership.institution_id}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
            <div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Institution dashboard</p>
                  <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-900">
                    {portal.university?.name || "Your institution"}
                  </h1>
                </div>
                {portal.partner?.verified_at ? <InstitutionVerificationBadge /> : null}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Separate from the student app, focused only on your institution’s content and performance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:block">
                Search programmes, leads, or pages
              </div>
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-200 hover:text-brand-900"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={async () => {
                  await portal.logout();
                  window.location.assign(buildAppUrl("/auth?mode=login"));
                }}
                className="rounded-2xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="px-5 py-6 lg:px-8">
          {portal.message ? (
            <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {portal.message}
            </p>
          ) : null}
          {portal.error ? (
            <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{portal.error}</p>
          ) : null}
          <Outlet context={portal} />
        </main>
      </div>
    </div>
  );
}

function CmsLoginPrompt() {
  useDocumentTitle("Institution Dashboard | Thuto");
  return (
    <div className="grid min-h-dvh place-items-center bg-[#f5f7f5] px-4">
      <div className="max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 shadow-card">
        <div className="flex items-center gap-3">
          <img src={thutoLogoSrc} alt="" className="h-12 w-12 rounded-2xl bg-brand-50 p-1.5" />
          <div>
            <p className="font-display text-xl font-semibold text-slate-900">Thuto</p>
            <p className="text-sm text-slate-500">Institution Dashboard</p>
          </div>
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold text-slate-900">Sign in to your standalone CMS</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          This frontend is for university and institution staff only. It is separate from the student app so your team only sees
          your own profile, programmes, analytics, feed tools, and FAQs.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={buildAppUrl("/auth?mode=login&next=/cms/")}
            className="rounded-2xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Sign in
          </a>
          <a
            href={buildAppUrl("/partners")}
            className="rounded-2xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            Learn about partner access
          </a>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const portal = usePortal();
  const navigate = useNavigate();
  useDocumentTitle("Home | Institution Dashboard");

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-br from-brand-950 via-brand-900 to-emerald-900 p-6 text-white shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/90">Home dashboard</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Welcome back, {portal.university?.shortName || portal.university?.name || "team"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50/90">
              Today’s overview blends live views, leads, and deadline data with demo dashboard cards for features that are still
              being rolled out.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-emerald-50">
            Showing demo metrics where live data is unavailable
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {portal.dashboard.metrics.map((metric) => (
          <article key={metric.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="mt-3 font-display text-3xl font-semibold text-slate-900">{formatCount(metric.value)}</p>
            <p className={`mt-2 text-sm font-semibold ${metric.live ? "text-emerald-600" : "text-amber-600"}`}>{metric.trend}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_1fr_1fr]">
        <Panel title="Recent activity" action="View leads" onAction={() => navigate("/leads")}>
          <div className="space-y-3">
            {portal.dashboard.recentActivity.map((item, index) => (
              <div key={`${item.title}-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <span className="mt-0.5 h-9 w-9 shrink-0 rounded-2xl bg-brand-50 text-center text-lg leading-9 text-brand-700">
                  •
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.detail}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(item.when).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Deadlines approaching">
          <div className="space-y-3">
            {portal.dashboard.deadlines.length ? (
              portal.dashboard.deadlines.map((deadline) => (
                <div key={`${deadline.title}-${deadline.date}`} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-center">
                    <div>
                      <p className="text-xs font-semibold uppercase text-brand-700">{new Date(deadline.date).toLocaleDateString(undefined, { month: "short" })}</p>
                      <p className="text-lg font-semibold text-brand-900">{new Date(deadline.date).getDate()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{deadline.title}</p>
                    <p className="text-sm text-slate-600">{deadline.detail}</p>
                    <p className="mt-1 text-xs text-amber-600">Due {formatShortDate(deadline.date)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No active deadlines yet. Add them in Profile or Programmes.</p>
            )}
          </div>
        </Panel>

        <Panel title="Latest reviews">
          <div className="space-y-3">
            {portal.dashboard.latestReviews.map((review) => (
              <div key={`${review.name}-${review.when}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{review.name}</p>
                  <p className="text-sm text-amber-500">{"★".repeat(review.rating)}</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">{review.quote}</p>
                <p className="mt-2 text-xs text-slate-400">{review.when}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_1fr_1fr]">
        <Panel title="Programme views this week" action="View analytics" onAction={() => navigate("/analytics")}>
          <div className="flex h-60 items-end gap-3">
            {portal.dashboard.weekSeries.map((point) => (
              <div key={point.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-44 w-full items-end">
                  <div
                    className="w-full rounded-t-2xl bg-gradient-to-t from-brand-700 to-brand-400"
                    style={{ height: `${(point.value / portal.dashboard.maxSeriesValue) * 100}%` }}
                    title={`${point.label}: ${formatCount(point.value)}`}
                  />
                </div>
                <p className="text-center text-xs text-slate-500">{point.label}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top programmes">
          <div className="space-y-3">
            {portal.dashboard.topProgrammes.map((programme) => (
              <div key={programme.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-800">{programme.label}</span>
                  <span className="text-slate-500">{formatCount(programme.count)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-brand-700"
                    style={{ width: `${Math.max(16, (programme.count / portal.dashboard.topProgrammes[0].count) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Students by country">
          <div className="space-y-3">
            <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-brand-50 p-6 text-center text-sm text-slate-500">
              Africa map placeholder
            </div>
            {portal.dashboard.topCountries.map((country) => (
              <div key={country.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="capitalize text-slate-700">{country.id.replaceAll("-", " ")}</span>
                <span className="font-semibold text-slate-900">{formatCount(country.count)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Quick actions">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {portal.dashboard.quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.to)}
                className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <p className="text-sm font-semibold text-slate-900">{action.label}</p>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="AI insights">
          <div className="space-y-3">
            {portal.dashboard.aiInsights.map((insight, index) => (
              <div key={index} className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Demo insight</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{insight}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function ProfilePage() {
  const portal = usePortal();
  useDocumentTitle("Profile | Institution Dashboard");
  const previewHref = portal.activeInstitutionId ? buildAppUrl(`/universities/${portal.activeInstitutionId}`) : buildAppUrl("/universities");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Institution profile</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">{portal.university?.name || "Your institution"}</h2>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900">
            {portal.profileCompleteness.completed}/{portal.profileCompleteness.total} public profile areas complete
          </div>
        </div>

        <FormSection title="Basic information">
          <textarea
            value={portal.profileForm.description}
            onChange={(event) => portal.setProfileForm((state) => ({ ...state, description: event.target.value }))}
            rows={5}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Institution description"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={portal.profileForm.universityType}
              onChange={(event) => portal.setProfileForm((state) => ({ ...state, universityType: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Institution type"
            />
            <input
              value={portal.profileForm.logo}
              onChange={(event) => portal.setProfileForm((state) => ({ ...state, logo: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Logo URL"
            />
          </div>
        </FormSection>

        <FormSection title="Admissions">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              Application opens
              <input
                type="date"
                value={portal.profileForm.applicationOpen}
                onChange={(event) => portal.setProfileForm((state) => ({ ...state, applicationOpen: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </label>
            <label className="text-sm text-slate-600">
              Application closes
              <input
                type="date"
                value={portal.profileForm.applicationClose}
                onChange={(event) => portal.setProfileForm((state) => ({ ...state, applicationClose: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </label>
            <input
              type="email"
              value={portal.profileForm.admissionsEmail}
              onChange={(event) => portal.setProfileForm((state) => ({ ...state, admissionsEmail: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Admissions email"
            />
            <input
              value={portal.profileForm.admissionsPhone}
              onChange={(event) => portal.setProfileForm((state) => ({ ...state, admissionsPhone: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Admissions phone"
            />
            <input
              value={portal.profileForm.applyUrl}
              onChange={(event) => portal.setProfileForm((state) => ({ ...state, applyUrl: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2"
              placeholder="Application website"
            />
          </div>
        </FormSection>

        <FormSection title="Contact and socials">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="email"
              value={portal.profileForm.generalEmail}
              onChange={(event) => portal.setProfileForm((state) => ({ ...state, generalEmail: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="General email"
            />
            <input
              value={portal.profileForm.generalPhone}
              onChange={(event) => portal.setProfileForm((state) => ({ ...state, generalPhone: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="General phone"
            />
            <input
              value={portal.profileForm.website}
              onChange={(event) => portal.setProfileForm((state) => ({ ...state, website: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2"
              placeholder="Website URL"
            />
            <input
              value={portal.profileForm.physicalAddress}
              onChange={(event) => portal.setProfileForm((state) => ({ ...state, physicalAddress: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2"
              placeholder="Physical address"
            />
            {UNIVERSITY_SOCIAL_PLATFORMS.map((platform) => {
              const key = `social${platform.key.charAt(0).toUpperCase()}${platform.key.slice(1)}`;
              return (
                <input
                  key={platform.key}
                  value={portal.profileForm[key]}
                  onChange={(event) => portal.setProfileForm((state) => ({ ...state, [key]: event.target.value }))}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder={`${platform.label} URL`}
                />
              );
            })}
          </div>
        </FormSection>

        <FormSection title="Campus photos and resources">
          <textarea
            value={portal.profileForm.campusPhotosText}
            onChange={(event) => portal.setProfileForm((state) => ({ ...state, campusPhotosText: event.target.value }))}
            rows={4}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="One campus photo URL per line"
          />
          <div className="space-y-3">
            {portal.resourceRows.map((row, index) => (
              <div key={`resource-${index}`} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
                <input
                  value={row.title}
                  onChange={(event) =>
                    portal.setResourceRows((rows) => rows.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)))
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Title"
                />
                <input
                  value={row.category}
                  onChange={(event) =>
                    portal.setResourceRows((rows) => rows.map((item, i) => (i === index ? { ...item, category: event.target.value } : item)))
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Category"
                />
                <input
                  value={row.format}
                  onChange={(event) =>
                    portal.setResourceRows((rows) => rows.map((item, i) => (i === index ? { ...item, format: event.target.value } : item)))
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Format"
                />
                <input
                  value={row.url}
                  onChange={(event) =>
                    portal.setResourceRows((rows) => rows.map((item, i) => (i === index ? { ...item, url: event.target.value } : item)))
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() => portal.setResourceRows((rows) => rows.filter((_, i) => i !== index))}
                  className="text-left text-sm font-semibold text-red-700"
                >
                  Remove resource
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => portal.setResourceRows((rows) => [...rows, { ...EMPTY_RESOURCE }])}
              className="rounded-2xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900"
            >
              Add resource
            </button>
          </div>
        </FormSection>

        <FormSection title="Student life and support">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={portal.profileForm.accommodationStatus}
              onChange={(event) => portal.setProfileForm((state) => ({ ...state, accommodationStatus: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Accommodation status"
            />
            <input
              value={portal.profileForm.accreditationStatus}
              onChange={(event) => portal.setProfileForm((state) => ({ ...state, accreditationStatus: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Accreditation status"
            />
            <textarea
              value={portal.profileForm.accommodationDetails}
              onChange={(event) => portal.setProfileForm((state) => ({ ...state, accommodationDetails: event.target.value }))}
              rows={3}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Accommodation details"
            />
            <textarea
              value={portal.profileForm.careerSupportDetails}
              onChange={(event) => portal.setProfileForm((state) => ({ ...state, careerSupportDetails: event.target.value }))}
              rows={3}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Career support details"
            />
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">Student incentives</p>
                <p className="text-sm text-slate-600">Optional support offers like bursaries, transport, WiFi, or devices.</p>
              </div>
              <button
                type="button"
                onClick={() => portal.setStudentLifeRows((rows) => [...rows, { ...EMPTY_INCENTIVE }])}
                className="rounded-2xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900"
              >
                Add incentive
              </button>
            </div>
            {portal.studentLifeRows.map((row, index) => (
              <div key={`incentive-${index}`} className="space-y-3 rounded-2xl bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    value={row.category}
                    onChange={(event) =>
                      portal.setStudentLifeRows((rows) =>
                        rows.map((item, i) => (i === index ? { ...item, category: event.target.value } : item)),
                      )
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    {Object.entries(STUDENT_INCENTIVE_CATEGORY_META).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={row.label}
                    onChange={(event) =>
                      portal.setStudentLifeRows((rows) =>
                        rows.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)),
                      )
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="Offer title"
                  />
                </div>
                <textarea
                  value={row.detail}
                  onChange={(event) =>
                    portal.setStudentLifeRows((rows) =>
                      rows.map((item, i) => (i === index ? { ...item, detail: event.target.value } : item)),
                    )
                  }
                  rows={2}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Short details"
                />
                <button
                  type="button"
                  onClick={() => portal.setStudentLifeRows((rows) => rows.filter((_, i) => i !== index))}
                  className="text-sm font-semibold text-red-700"
                >
                  Remove incentive
                </button>
              </div>
            ))}
          </div>
        </FormSection>

        <button
          type="button"
          onClick={portal.handleSaveProfile}
          className="rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Publish profile changes
        </button>
      </section>

      <section className="space-y-5">
        <Panel title="Student preview">
          <p className="text-sm leading-relaxed text-slate-600">
            Open the public student-facing institution page in a new tab to verify that the details students see match what you
            just updated in the dashboard.
          </p>
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-2xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Preview in student app
          </a>
        </Panel>
      </section>
    </div>
  );
}

function StaffPage() {
  const portal = usePortal();
  useDocumentTitle("Staff | Institution Dashboard");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Staff</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">Public staff directory</h2>
          </div>
          <button
            type="button"
            onClick={() => portal.setStaffRows((rows) => [...rows, { ...EMPTY_STAFF }])}
            className="rounded-2xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900"
          >
            Add person
          </button>
        </div>

        {portal.staffRows.map((row, index) => (
          <div key={`staff-${index}`} className="grid gap-3 rounded-3xl bg-slate-50 p-4 md:grid-cols-2">
            <input
              value={row.name}
              onChange={(event) =>
                portal.setStaffRows((rows) => rows.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Full name"
            />
            <input
              value={row.title}
              onChange={(event) =>
                portal.setStaffRows((rows) => rows.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Position"
            />
            <input
              value={row.department}
              onChange={(event) =>
                portal.setStaffRows((rows) =>
                  rows.map((item, i) => (i === index ? { ...item, department: event.target.value } : item)),
                )
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Department"
            />
            <input
              type="email"
              value={row.email}
              onChange={(event) =>
                portal.setStaffRows((rows) => rows.map((item, i) => (i === index ? { ...item, email: event.target.value } : item)))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Email"
            />
            <input
              value={row.phone}
              onChange={(event) =>
                portal.setStaffRows((rows) => rows.map((item, i) => (i === index ? { ...item, phone: event.target.value } : item)))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2"
              placeholder="Phone"
            />
            <button
              type="button"
              onClick={() => portal.setStaffRows((rows) => rows.filter((_, i) => i !== index))}
              className="text-left text-sm font-semibold text-red-700"
            >
              Remove person
            </button>
          </div>
        ))}

        {!portal.staffRows.length ? <p className="text-sm text-slate-500">No public staff contacts yet.</p> : null}

        <button
          type="button"
          onClick={portal.handleSaveStaff}
          className="rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Publish staff
        </button>
      </section>

      <Panel title="Portal access">
        <p className="text-sm leading-relaxed text-slate-600">
          Full invite and permission workflows are planned next. For now, this panel shows the institution memberships already
          attached to the signed-in user.
        </p>
        <div className="mt-4 space-y-3">
          {portal.memberships.map((membership) => (
            <div key={membership.institution_id} className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="font-semibold text-slate-900">{membership.institution_id}</p>
              <p className="mt-1 text-sm text-slate-600">{membership.role}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ProgrammesPage() {
  const portal = usePortal();
  useDocumentTitle("Programmes | Institution Dashboard");

  return (
    <div className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Programmes</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">Manage institution programmes</h2>
      </div>

      <select
        value={portal.selectedProgrammeId}
        onChange={(event) => portal.fillProgrammeForm(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
      >
        <option value="">Select programme</option>
        {portal.institutionProgrammes.map((programme) => (
          <option key={programme.id} value={programme.id}>
            {programme.name}
          </option>
        ))}
      </select>

      {portal.selectedProgrammeId ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <textarea
            value={portal.programmeForm.description}
            onChange={(event) => portal.setProgrammeForm((state) => ({ ...state, description: event.target.value }))}
            rows={5}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm xl:col-span-2"
            placeholder="Programme description"
          />
          <input
            value={portal.programmeForm.applyUrl}
            onChange={(event) => portal.setProgrammeForm((state) => ({ ...state, applyUrl: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="External application link"
          />
          <input
            value={portal.programmeForm.officialUrl}
            onChange={(event) => portal.setProgrammeForm((state) => ({ ...state, officialUrl: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Official programme page"
          />
          <input
            type="date"
            value={portal.programmeForm.applicationDeadline}
            onChange={(event) => portal.setProgrammeForm((state) => ({ ...state, applicationDeadline: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
          <input
            value={portal.programmeForm.minPoints}
            onChange={(event) => portal.setProgrammeForm((state) => ({ ...state, minPoints: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Minimum points"
          />
          <input
            value={portal.programmeForm.feesDomestic}
            onChange={(event) => portal.setProgrammeForm((state) => ({ ...state, feesDomestic: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={`Domestic fees (${defaultCurrencyForCountry(portal.university?.country)})`}
          />
          <input
            value={portal.programmeForm.accreditationStatus}
            onChange={(event) => portal.setProgrammeForm((state) => ({ ...state, accreditationStatus: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Accreditation status"
          />
          <textarea
            value={portal.programmeForm.accreditationNotes}
            onChange={(event) => portal.setProgrammeForm((state) => ({ ...state, accreditationNotes: event.target.value }))}
            rows={3}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm xl:col-span-2"
            placeholder="Accreditation notes"
          />
          <textarea
            value={portal.programmeForm.careers}
            onChange={(event) => portal.setProgrammeForm((state) => ({ ...state, careers: event.target.value }))}
            rows={4}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Career outcomes (one per line)"
          />
          <textarea
            value={portal.programmeForm.jobOpportunities}
            onChange={(event) => portal.setProgrammeForm((state) => ({ ...state, jobOpportunities: event.target.value }))}
            rows={4}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Common jobs after graduation (one per line)"
          />
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Scholarship, media, SEO, and richer statistics panels are reserved spaces in this first release.
          </div>
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Views, saves, shares, and applications will populate here as the remaining analytics surfaces go live.
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Choose a programme to edit its public details, deadlines, and CTA links.</p>
      )}

      <button
        type="button"
        onClick={portal.handleSaveProgramme}
        disabled={!portal.selectedProgrammeId}
        className="rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Update programme
      </button>
    </div>
  );
}

function AnalyticsPage() {
  const portal = usePortal();
  const navigate = useNavigate();
  useDocumentTitle("Data and Analytics | Institution Dashboard");

  return (
    <div className="space-y-5">
      <PartnerInsightsDashboard
        universityName={portal.university?.name || portal.activeInstitutionId}
        programmeCount={portal.institutionProgrammes.length}
        tier={portal.partner?.tier || "verified"}
        newLeads={portal.leads.filter((lead) => lead.status === "new").length}
        summary={portal.analyticsSummary}
        profileCompleteness={portal.profileCompleteness}
        onOpenModule={(moduleId) => {
          if (moduleId === "leads") {
            navigate("/leads");
          }
        }}
      />

      <Panel title="Export reports">
        <p className="text-sm leading-relaxed text-slate-600">
          CSV/PDF exports are stubbed in this release. For now, use the live dashboard above to monitor programme views, link
          clicks, viewer countries, and institution profile performance.
        </p>
      </Panel>
    </div>
  );
}

function LeadsPage() {
  const portal = usePortal();
  useDocumentTitle("Leads | Institution Dashboard");

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Leads</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">Admissions lead inbox</h2>
      </div>
      {portal.leads.map((lead) => (
        <article key={lead.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{lead.lead_type}</p>
              <p className="text-sm text-slate-500">{new Date(lead.created_at).toLocaleString()}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              {lead.status}
            </span>
          </div>
          <pre className="mt-4 overflow-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">{JSON.stringify(lead.payload, null, 2)}</pre>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                await portal.updateLeadStatus(lead.id, "contacted");
                await portal.loadInstitution(portal.activeInstitutionId);
              }}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Mark contacted
            </button>
            <button
              type="button"
              onClick={async () => {
                await portal.updateLeadStatus(lead.id, "archived");
                await portal.loadInstitution(portal.activeInstitutionId);
              }}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Archive
            </button>
          </div>
        </article>
      ))}
      {!portal.leads.length ? <p className="text-sm text-slate-500">No leads yet.</p> : null}
    </div>
  );
}

function ClaimPage() {
  const portal = usePortal();
  useDocumentTitle("Claim profile | Institution Dashboard");

  return (
    <div className="max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Claim access</p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">Claim your institution</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        No partner access is linked to your account yet. Submit an official work email so Thuto can verify your institution.
      </p>
      <div className="mt-5 space-y-4">
        <select
          value={portal.claimInstitutionId}
          onChange={(event) => portal.setClaimInstitutionId(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        >
          <option value="">Select institution</option>
          {portal.allUniversities.map((university) => (
            <option key={university.id} value={university.id}>
              {university.name}
            </option>
          ))}
        </select>
        <input
          type="email"
          value={portal.claimEmail}
          onChange={(event) => portal.setClaimEmail(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder="Official work email"
        />
        <button
          type="button"
          onClick={portal.handleClaim}
          className="rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Submit claim
        </button>
      </div>
    </div>
  );
}

function StubPage({ title, description }) {
  useDocumentTitle(`${title} | Institution Dashboard`);
  return (
    <div className="max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">{title}</p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}

function Panel({ title, action, onAction, children }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-xl font-semibold text-slate-900">{title}</h3>
        {action ? (
          <button type="button" onClick={onAction} className="text-sm font-semibold text-brand-700 hover:text-brand-900">
            {action}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FormSection({ title, children }) {
  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export default function CmsApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<CmsShell />}>
          <Route index element={<HomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="programmes" element={<ProgrammesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route
            path="feed"
            element={
              <StubPage
                title="Feed"
                description="Institution feed publishing, scheduling, moderation, and engagement insights are stubbed in this release so the standalone CMS ships with the correct navigation and dashboard actions first."
              />
            }
          />
          <Route
            path="faq"
            element={
              <StubPage
                title="FAQ"
                description="FAQ management and review workflows are next. This placeholder keeps the standalone dashboard aligned with the agreed 7-section information architecture."
              />
            }
          />
          <Route
            path="settings"
            element={
              <StubPage
                title="Settings"
                description="Settings are not part of the 7 primary sidebar sections, but this stub keeps room for branding, notifications, and integration controls in the CMS frontend."
              />
            }
          />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="claim" element={<ClaimPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
