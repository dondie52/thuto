import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthProvider, useAuth } from "../lib/auth.jsx";
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { thutoLogoSrc } from "../components/BrandMark.jsx";
import InstitutionVerificationBadge from "../components/InstitutionVerificationBadge.jsx";
import PartnerInsightsDashboard from "../components/partner/PartnerInsightsDashboard.jsx";
import { PhotoGalleryField, PhotoUploadField } from "../components/partner/PhotoUploadField.jsx";
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
  ACCOMMODATION_OFF,
  ACCOMMODATION_ON,
  ACCREDITATION_OFF,
  ACCREDITATION_ON,
  APPLICATION_WINDOW_CLOSED,
  APPLICATION_WINDOW_OPEN,
  UNIVERSITY_SOCIAL_PLATFORMS,
  isAffirmativeStatus,
  isApplicationWindowOpen,
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
import { marketCountryLabel } from "../lib/marketCountry.js";

const NAV_ITEMS = [
  { to: "/", end: true, label: "Home", icon: "home" },
  { to: "/profile", label: "Profile", icon: "profile" },
  { to: "/programmes", label: "Programmes", icon: "programmes" },
  { to: "/leads", label: "Leads", icon: "leads" },
  { to: "/analytics", label: "Data and Analytics", icon: "analytics" },
  { to: "/feed", label: "Feed", icon: "feed" },
  { to: "/faq", label: "FAQ", icon: "faq" },
];

const RAIL_FOOTER_ITEMS = [
  { href: buildAppUrl("/support"), label: "Support", icon: "support" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

const EMPTY_RESOURCE = { title: "", category: "", url: "", format: "Web page", sourceLabel: "" };
const EMPTY_STAFF = { name: "", title: "", email: "", phone: "", department: "", photo: "" };
const EMPTY_INCENTIVE = { category: "other", label: "", detail: "", sourceUrl: "", sourceLabel: "" };
const EMPTY_PROGRAMME_FORM = {
  description: "",
  applyUrl: "",
  officialUrl: "",
  applicationWindowStatus: APPLICATION_WINDOW_OPEN,
  applicationDeadline: "",
  feesDomestic: "",
  minPoints: "",
  accreditationStatus: "",
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
    photo: row?.photo || "",
  }));
}

// Storage RLS only lets institution staff write under this prefix.
function institutionAssetFolder(institutionId) {
  const id = String(institutionId || "unknown").replace(/[^a-z0-9_-]+/gi, "-");
  return `institutions/${id}`;
}

function formatCount(value) {
  return new Intl.NumberFormat().format(Math.max(0, Number(value) || 0));
}

function formatShortDate(value) {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const ICON_PATHS = {
  home: ["M3.5 11 12 4l8.5 7", "M5.75 9.4V20h12.5V9.4", "M9.75 20v-5.25h4.5V20"],
  profile: [
    "M3.5 20.5h17",
    "M6 20.5V5.5A1.5 1.5 0 0 1 7.5 4h9A1.5 1.5 0 0 1 18 5.5v15",
    "M9.5 8h1.5M13 8h1.5M9.5 11.5h1.5M13 11.5h1.5",
    "M10.5 20.5v-4h3v4",
  ],
  programmes: [
    "M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z",
    "M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z",
  ],
  analytics: ["M4 20h16", "M7.5 20v-5.5", "M12 20V7", "M16.5 20v-9"],
  feed: [
    "M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z",
    "M7.5 9h9M7.5 12.25h9M7.5 15.5h5.5",
  ],
  faq: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M9.6 9.6a2.4 2.4 0 1 1 3.3 2.23c-.55.22-.9.75-.9 1.34v.58", "M12 16.6h.01"],
  settings: [
    "M4 7.5h9",
    "M17 7.5h3",
    "M4 16.5h3",
    "M11 16.5h9",
    "M17 7.5a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z",
    "M11 16.5a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z",
  ],
  support: [
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
    "M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z",
    "M14.4 9.6 17.7 6.3M6.3 17.7l3.3-3.3M14.4 14.4l3.3 3.3M6.3 6.3l3.3 3.3",
  ],
  staff: [
    "M9.25 11.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z",
    "M3.5 20v-.75a5.75 5.75 0 0 1 11.5 0V20",
    "M16.25 5.6a3.25 3.25 0 0 1 0 5.9",
    "M17.5 14.6A5.75 5.75 0 0 1 20.5 20",
  ],
  eye: [
    "M2.5 12S6 5.9 12 5.9 21.5 12 21.5 12 18 18.1 12 18.1 2.5 12 2.5 12Z",
    "M12 14.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z",
  ],
  apps: ["M6.5 3.5h7L18.5 8.5V20a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z", "M13.5 3.5v5h5", "m9 14.5 2 2 3.5-3.75"],
  leads: [
    "M9.75 11.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z",
    "M3 20.25v-.75a5.5 5.5 0 0 1 5.5-5.5h2.5a5.5 5.5 0 0 1 5.5 5.5v.75",
    "M18.75 6v5M21.25 8.5h-5",
  ],
  reviews: ["m12 4.25 2.4 4.86 5.35.78-3.87 3.77.91 5.34L12 16.48l-4.79 2.52.91-5.34-3.87-3.77 5.35-.78Z"],
  edit: ["M4.5 19.5h4l10-10a2.12 2.12 0 0 0-3-3l-10 10Z", "M14.5 6.5l3 3"],
  lock: [
    "M6.5 10.5h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z",
    "M8.75 10.5V8a3.25 3.25 0 0 1 6.5 0v2.5",
  ],
};

function Icon({ name, className = "h-5 w-5" }) {
  const paths = ICON_PATHS[name] || ICON_PATHS.faq;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

function daysAgoKey(daysBack) {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() - daysBack);
  return day.toISOString().slice(0, 10);
}

function sumEventInRange(rows, eventName, startKey, endKey) {
  let total = 0;
  for (const row of rows || []) {
    if (row.event_name !== eventName) continue;
    if (row.event_date < startKey || row.event_date > endKey) continue;
    total += Number(row.count) || 0;
  }
  return total;
}

function trendLabel(current, previous) {
  if (!current && !previous) return "No change";
  if (!previous && current) return "New activity";
  if (!current && previous) return "↓ 100% vs prior 7 days";
  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.abs(delta).toFixed(1);
  if (delta > 0) return `↑ ${rounded}% vs prior 7 days`;
  if (delta < 0) return `↓ ${rounded}% vs prior 7 days`;
  return "No change vs prior 7 days";
}

function countryDisplayName(id) {
  const code = String(id || "")
    .trim()
    .toLowerCase();
  if (!code || code === "unknown") return "Unknown";
  const fromMarket = marketCountryLabel(code);
  if (fromMarket && fromMarket !== code) return fromMarket;
  return code.replaceAll("-", " ").replaceAll("_", " ");
}

function firstNameFromProfile(profile, user) {
  const full = profile?.full_name?.trim() || user?.user_metadata?.full_name || "";
  if (full) return full.split(/\s+/)[0];
  const email = user?.email || "";
  return email ? email.split("@")[0] : "there";
}

function buildLiveDashboard(university, summary, institutionProgrammes, leads, analyticsRows) {
  const programmeViews = summary.totals.programme_view || 0;
  const profileViews = summary.totals.institution_profile_view || 0;
  const applyClicks = summary.totals.apply_click || 0;
  const outboundClicks = summary.outboundClicks || 0;
  const totalLeads = leads.length;
  const newLeads = leads.filter((lead) => lead.status === "new").length;

  const thisWeekStart = daysAgoKey(6);
  const thisWeekEnd = daysAgoKey(0);
  const priorWeekStart = daysAgoKey(13);
  const priorWeekEnd = daysAgoKey(7);

  const programmeViewsWeek = sumEventInRange(analyticsRows, "programme_view", thisWeekStart, thisWeekEnd);
  const programmeViewsPrior = sumEventInRange(analyticsRows, "programme_view", priorWeekStart, priorWeekEnd);
  const profileViewsWeek = sumEventInRange(analyticsRows, "institution_profile_view", thisWeekStart, thisWeekEnd);
  const profileViewsPrior = sumEventInRange(analyticsRows, "institution_profile_view", priorWeekStart, priorWeekEnd);
  const applyClicksWeek = sumEventInRange(analyticsRows, "apply_click", thisWeekStart, thisWeekEnd);
  const applyClicksPrior = sumEventInRange(analyticsRows, "apply_click", priorWeekStart, priorWeekEnd);

  const leadsThisWeek = leads.filter((lead) => lead.created_at && lead.created_at.slice(0, 10) >= thisWeekStart).length;
  const leadsPriorWeek = leads.filter((lead) => {
    const key = lead.created_at?.slice(0, 10);
    return key && key >= priorWeekStart && key <= priorWeekEnd;
  }).length;

  const chartByDate = new Map();
  for (const row of analyticsRows || []) {
    if (row.event_name !== "programme_view") continue;
    chartByDate.set(row.event_date, (chartByDate.get(row.event_date) || 0) + (Number(row.count) || 0));
  }
  const weekSeries = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const key = day.toISOString().slice(0, 10);
    return {
      key,
      label: day.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
      value: chartByDate.get(key) || 0,
    };
  });
  const maxSeriesValue = Math.max(...weekSeries.map((row) => row.value), 1);
  const hasWeekViews = weekSeries.some((row) => row.value > 0);

  const topProgrammes = summary.topProgrammes.slice(0, 5).map((row) => ({
    label: row.label || row.id,
    count: row.count,
  }));
  const countryTotal = summary.topCountries.reduce((sum, row) => sum + row.count, 0) || 0;
  const topCountries = summary.topCountries.slice(0, 6).map((row) => ({
    id: row.id,
    label: countryDisplayName(row.id),
    count: row.count,
    share: countryTotal ? Math.round((row.count / countryTotal) * 1000) / 10 : 0,
  }));

  const now = Date.now();
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
        detail: "Programme application deadline",
      })),
  ]
    .filter(Boolean)
    .filter((item) => {
      const ts = new Date(item.date).getTime();
      return !Number.isNaN(ts) && ts >= now - 1000 * 60 * 60 * 24;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5)
    .map((item) => {
      const daysLeft = Math.ceil((new Date(item.date).getTime() - now) / (1000 * 60 * 60 * 24));
      return { ...item, daysLeft };
    });

  const programmeNameById = new Map(institutionProgrammes.map((row) => [row.id, row.name || row.id]));
  const recentActivity = leads.slice(0, 8).map((lead) => ({
    title: lead.status === "new" ? "New student lead" : `Lead ${lead.status}`,
    detail: lead.programme_id
      ? `${lead.lead_type || "inquiry"} for ${programmeNameById.get(lead.programme_id) || lead.programme_id}`
      : `${lead.lead_type || "inquiry"} submitted for your institution`,
    when: lead.created_at,
  }));

  const metrics = [
    {
      label: "Programme views",
      value: programmeViews,
      trend: trendLabel(programmeViewsWeek, programmeViewsPrior),
      tone: programmeViewsWeek >= programmeViewsPrior ? "up" : "down",
      icon: "eye",
    },
    {
      label: "Applications",
      value: applyClicks,
      trend: trendLabel(applyClicksWeek, applyClicksPrior),
      tone: applyClicksWeek >= applyClicksPrior ? "up" : "down",
      icon: "apps",
    },
    {
      label: "New leads",
      value: newLeads,
      trend: trendLabel(leadsThisWeek, leadsPriorWeek),
      tone: leadsThisWeek >= leadsPriorWeek ? "up" : "down",
      hint: `${totalLeads} total captured`,
      icon: "leads",
    },
    {
      label: "Unanswered questions",
      value: 0,
      trend: "FAQ module not live yet",
      tone: "neutral",
      icon: "faq",
    },
    {
      label: "Pending reviews",
      value: 0,
      trend: "Reviews module not live yet",
      tone: "neutral",
      icon: "reviews",
    },
  ];

  const aiInsights = [];
  if (topProgrammes[0]) {
    aiInsights.push({
      title: "Top programme interest",
      body: `${topProgrammes[0].label} currently leads with ${formatCount(topProgrammes[0].count)} programme page views.`,
    });
  }
  if (newLeads > 0) {
    aiInsights.push({
      title: "Lead follow-up",
      body: `${formatCount(newLeads)} new leads are waiting in your inbox.`,
    });
  }
  if (deadlines[0]) {
    aiInsights.push({
      title: "Nearest deadline",
      body: `${deadlines[0].title} is due ${formatShortDate(deadlines[0].date)} (${deadlines[0].daysLeft} day${deadlines[0].daysLeft === 1 ? "" : "s"} left).`,
    });
  }
  if (profileViews === 0 && programmeViews === 0) {
    aiInsights.push({
      title: "Waiting on student traffic",
      body: "No profile or programme views have been recorded yet for this institution in Supabase analytics.",
    });
  }

  const rangeLabel = `${new Date(thisWeekStart).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${new Date(thisWeekEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  return {
    metrics,
    weekSeries,
    maxSeriesValue,
    hasWeekViews,
    topProgrammes,
    topCountries,
    countryTotal,
    deadlines,
    recentActivity,
    profileViews,
    programmeViews,
    applyClicks,
    outboundClicks,
    totalLeads,
    newLeads,
    aiInsights,
    rangeLabel,
    quickActions: [
      { label: "Add New Programme", detail: "Publish another course", to: "/programmes", icon: "programmes" },
      { label: "Create Feed Post", detail: "Reach students on Feed", to: "/feed", icon: "feed" },
      { label: "Answer Question", detail: "Open FAQ workspace", to: "/faq", icon: "faq" },
      { label: "Invite Staff", detail: "Grow your admin team", to: "/profile?tab=staff", icon: "staff" },
      { label: "View Analytics", detail: "Deep-dive performance", to: "/analytics", icon: "analytics" },
    ],
  };
}

function usePartnerPortalData() {
  const { user, profile, isLoading, isSuperuser, logout } = useAuth();
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
    applicationWindowStatus: APPLICATION_WINDOW_OPEN,
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
    accommodationStatus: "",
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
      fetchInstitutionAnalytics(institutionId, 14),
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
        applicationWindowStatus: isApplicationWindowOpen(uni.applicationWindowStatus)
          ? APPLICATION_WINDOW_OPEN
          : APPLICATION_WINDOW_CLOSED,
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
        accreditationStatus: accreditation.status
          ? isAffirmativeStatus(accreditation.status)
            ? ACCREDITATION_ON
            : ACCREDITATION_OFF
          : "",
        accommodationStatus: studentLife.accommodationStatus
          ? isAffirmativeStatus(studentLife.accommodationStatus)
            ? ACCOMMODATION_ON
            : ACCOMMODATION_OFF
          : "",
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
    () => buildLiveDashboard(university, analyticsSummary, institutionProgrammes, leads, analytics),
    [analytics, analyticsSummary, institutionProgrammes, leads, university],
  );

  const hasAccess = memberships.length > 0 || isSuperuser;
  const displayFirstName = firstNameFromProfile(profile, user);
  const roleLabel =
    memberships.find((item) => item.institution_id === activeInstitutionId)?.role || (isSuperuser ? "super admin" : "editor");

  async function handleSaveProfile() {
    setError("");
    setMessage("");
    try {
      await saveInstitutionOverride(activeInstitutionId, {
        description: profileForm.description,
        applicationWindowStatus: profileForm.applicationWindowStatus || APPLICATION_WINDOW_OPEN,
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
        accommodationStatus: profileForm.accommodationStatus || null,
        // Retired free-text fields — nulled so values saved before the toggles disappear.
        accreditationBody: null,
        accreditationNotes: null,
        accreditationSourceUrl: null,
        accommodationDetails: null,
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
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      return false;
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
          photo: row.photo.trim(),
        }))
        .filter((row) => row.name);
      await saveInstitutionOverride(activeInstitutionId, { staff });
      setMessage("Staff contacts saved and published.");
      await loadInstitution(activeInstitutionId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      return false;
    }
  }

  async function handleSaveProgramme() {
    if (!selectedProgrammeId) return false;
    setError("");
    setMessage("");
    try {
      const patch = {
        description: programmeForm.description || null,
        applyUrl: programmeForm.applyUrl || null,
        officialUrl: programmeForm.officialUrl || null,
        applicationWindowStatus: programmeForm.applicationWindowStatus || APPLICATION_WINDOW_OPEN,
        applicationDeadline: programmeForm.applicationDeadline || null,
        accreditationStatus: programmeForm.accreditationStatus || null,
        // Retired free-text fields — nulled so values saved before the toggle disappear.
        accreditationBody: null,
        accreditationNotes: null,
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
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      return false;
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
      applicationWindowStatus: isApplicationWindowOpen(programme.applicationWindowStatus)
        ? APPLICATION_WINDOW_OPEN
        : APPLICATION_WINDOW_CLOSED,
      applicationDeadline: programme.applicationDeadline?.slice(0, 10) || "",
      feesDomestic: programme.fees?.domestic != null ? String(programme.fees.domestic) : "",
      minPoints: programme.minPoints != null ? String(programme.minPoints) : "",
      accreditationStatus: programme.accreditationStatus
        ? isAffirmativeStatus(programme.accreditationStatus)
          ? ACCREDITATION_ON
          : ACCREDITATION_OFF
        : "",
      careers: [...new Set([...(programme.careers || []), ...(programme.careerOpportunities || [])])].join("\n"),
      jobOpportunities: (programme.jobOpportunities || []).join("\n"),
    });
  }

  return {
    user,
    profile,
    displayFirstName,
    roleLabel,
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
    <div className="min-h-dvh bg-[#f5f7f5] text-slate-900 lg:grid lg:grid-cols-[76px_minmax(0,1fr)]">
      <aside
        data-cms="rail"
        className="z-30 flex flex-col items-center border-r border-white/10 bg-brand-950 text-white lg:sticky lg:top-0 lg:h-dvh"
      >
        <div data-cms="rail-brand" className="px-3 py-4">
          <NavLink to="/" end className="focus-ring-on-dark block rounded-2xl" aria-label="Institution dashboard home">
            <img src={thutoLogoSrc} alt="Thuto" className="h-11 w-11 rounded-2xl bg-white/10 p-1.5" />
          </NavLink>
        </div>

        <nav data-cms="rail-nav" className="flex flex-col items-center gap-1.5 px-3">
          {NAV_ITEMS.map((item) => (
            <RailLink key={item.to} item={item} />
          ))}
        </nav>

        <div data-cms="rail-footer" className="mt-auto flex flex-col items-center gap-1.5 px-3 pb-4 pt-4">
          {RAIL_FOOTER_ITEMS.map((item) => (
            <RailLink key={item.to || item.href} item={item} />
          ))}
        </div>
      </aside>

      <div className="min-w-0">
        <header data-cms="topbar" className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8 2xl:px-10">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Institution dashboard</p>
                  <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-900">
                    {portal.university?.name || "Your institution"}
                  </h1>
                </div>
                {portal.partner?.verified_at ? <InstitutionVerificationBadge /> : null}
                {portal.memberships.length > 1 ? (
                  <select
                    value={portal.activeInstitutionId}
                    onChange={(event) => portal.setSelectedInstitutionId(event.target.value)}
                    aria-label="Switch institution"
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    {portal.memberships.map((membership) => (
                      <option key={membership.institution_id} value={membership.institution_id}>
                        {membership.institution_id}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Separate from the student app, focused only on your institution’s content and performance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden min-w-[280px] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 xl:block">
                Search programmes, leads, or pages
                <span className="ml-3 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-400">
                  ⌘K
                </span>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">{portal.profile?.full_name || portal.displayFirstName}</p>
                <p className="text-xs capitalize text-slate-500">{portal.roleLabel}</p>
              </div>
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

        <main className="px-5 py-6 lg:px-8 2xl:px-10">
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

const RAIL_LINK_BASE =
  "focus-ring-on-dark group relative grid h-11 w-11 place-items-center rounded-2xl transition hover:bg-white/10 hover:text-white";

function RailTooltip({ label }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block"
    >
      {label}
    </span>
  );
}

function RailLink({ item }) {
  if (item.href) {
    return (
      <a href={item.href} aria-label={item.label} className={`${RAIL_LINK_BASE} text-white/70`}>
        <Icon name={item.icon} />
        <span className="sr-only">{item.label}</span>
        <RailTooltip label={item.label} />
      </a>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      aria-label={item.label}
      className={({ isActive }) => [RAIL_LINK_BASE, isActive ? "bg-emerald-500/25 text-white" : "text-white/70"].join(" ")}
    >
      <Icon name={item.icon} />
      <span className="sr-only">{item.label}</span>
      <RailTooltip label={item.label} />
    </NavLink>
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
  const maxProgrammeCount = portal.dashboard.topProgrammes[0]?.count || 1;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            Welcome back, {portal.displayFirstName}!
          </h2>
          <p className="mt-2 text-sm text-slate-600">Here’s what’s happening with your institution today.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
          {portal.dashboard.rangeLabel}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {portal.dashboard.metrics.map((metric) => (
          <article key={metric.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">{metric.label}</p>
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-50 text-brand-800">
                <Icon name={metric.icon} />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold text-slate-900">{formatCount(metric.value)}</p>
            <p
              className={[
                "mt-2 text-sm font-semibold",
                metric.tone === "up" ? "text-emerald-600" : "",
                metric.tone === "down" ? "text-rose-600" : "",
                metric.tone === "neutral" ? "text-slate-500" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {metric.trend}
            </p>
            {metric.hint ? <p className="mt-1 text-xs text-slate-400">{metric.hint}</p> : null}
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Panel title="Recent activity" action="View leads" onAction={() => navigate("/leads")}>
          {portal.dashboard.recentActivity.length ? (
            <div className="space-y-3">
              {portal.dashboard.recentActivity.map((item, index) => (
                <div key={`${item.title}-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
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
          ) : (
            <p className="text-sm text-slate-500">No lead activity yet. New student enquiries will appear here from Supabase.</p>
          )}
        </Panel>

        <Panel title="Deadlines approaching">
          {portal.dashboard.deadlines.length ? (
            <div className="space-y-3">
              {portal.dashboard.deadlines.map((deadline) => (
                <div key={`${deadline.title}-${deadline.date}`} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-center">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-brand-700">
                        {new Date(deadline.date).toLocaleDateString(undefined, { month: "short" })}
                      </p>
                      <p className="text-lg font-semibold leading-none text-brand-900">{new Date(deadline.date).getDate()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{deadline.title}</p>
                    <p className="text-sm text-slate-600">{deadline.detail}</p>
                    <p className="mt-1 text-xs font-semibold text-amber-600">
                      {deadline.daysLeft < 0 ? "Passed" : `${deadline.daysLeft} day${deadline.daysLeft === 1 ? "" : "s"} left`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No upcoming deadlines in your published profile or programmes.</p>
          )}
        </Panel>

        <Panel title="Latest reviews" action="Open FAQ" onAction={() => navigate("/faq")}>
          <p className="text-sm text-slate-500">
            Reviews are not stored yet. Once the FAQ & Reviews backend is live, student ratings will appear here from Supabase.
          </p>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Panel title="Programme views (this week)" action="View analytics" onAction={() => navigate("/analytics")}>
          {portal.dashboard.hasWeekViews ? (
            <div className="flex h-60 items-end gap-3">
              {portal.dashboard.weekSeries.map((point) => (
                <div key={point.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-44 w-full items-end">
                    <div
                      className="w-full rounded-t-2xl bg-gradient-to-t from-brand-700 to-brand-400"
                      style={{ height: `${Math.max(4, (point.value / portal.dashboard.maxSeriesValue) * 100)}%` }}
                      title={`${point.label}: ${formatCount(point.value)}`}
                    />
                  </div>
                  <p className="text-center text-xs text-slate-500">{point.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No programme views recorded in the last 7 days.</p>
          )}
        </Panel>

        <Panel title="Top programmes">
          {portal.dashboard.topProgrammes.length ? (
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
                      style={{ width: `${Math.max(8, (programme.count / maxProgrammeCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No programme view rankings yet for this institution.</p>
          )}
        </Panel>

        <Panel title="Students by country">
          {portal.dashboard.topCountries.length ? (
            <div className="space-y-3">
              <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-brand-50 px-4 py-5 text-sm text-slate-600">
                Live viewer origins from Supabase analytics ({formatCount(portal.dashboard.countryTotal)} engagements).
              </div>
              {portal.dashboard.topCountries.map((country) => (
                <div key={country.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-700">{country.label}</span>
                  <span className="font-semibold text-slate-900">
                    {country.share}% · {formatCount(country.count)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No country breakdown yet. Origins appear after students view your pages.</p>
          )}
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel title="Quick actions">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {portal.dashboard.quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.to)}
                className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-brand-800 shadow-sm">
                  <Icon name={action.icon} />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-900">{action.label}</p>
                <p className="mt-1 text-xs text-slate-500">{action.detail}</p>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="AI insights">
          {portal.dashboard.aiInsights.length ? (
            <div className="space-y-3">
              {portal.dashboard.aiInsights.map((insight) => (
                <div key={insight.title} className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">{insight.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{insight.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Insights will appear once live analytics or leads are available.</p>
          )}
        </Panel>
      </section>
    </div>
  );
}

const PROFILE_TABS = [
  { id: "basics", label: "Basic information", hint: "How your institution introduces itself to students." },
  { id: "admissions", label: "Admissions", hint: "Application windows and where students apply." },
  { id: "contact", label: "Contact and social", hint: "Ways students and parents can reach you." },
  { id: "campus", label: "Campus and resources", hint: "Photos and downloadable material students can browse." },
  { id: "student-life", label: "Student life and support", hint: "Accommodation, accreditation, wellbeing and support." },
  { id: "staff", label: "Staff", hint: "The public directory students see, plus portal access." },
];

const SOCIAL_FIELDS = UNIVERSITY_SOCIAL_PLATFORMS.map((platform) => ({
  key: `social${platform.key.charAt(0).toUpperCase()}${platform.key.slice(1)}`,
  label: `${platform.label} URL`,
  type: "url",
}));

const ACCREDITATION_TOGGLE = {
  type: "toggle",
  onValue: ACCREDITATION_ON,
  offValue: ACCREDITATION_OFF,
  onLabel: "Accredited",
  offLabel: "Not accredited",
};

const APPLICATION_WINDOW_TOGGLE = {
  key: "applicationWindowStatus",
  label: "Application window",
  type: "toggle",
  onValue: APPLICATION_WINDOW_OPEN,
  offValue: APPLICATION_WINDOW_CLOSED,
  onLabel: "Open",
  offLabel: "Closed",
  span: "full",
};

const TAB_FIELDS = {
  basics: [
    { key: "description", label: "Institution description", type: "textarea", rows: 5, span: "full" },
    { key: "universityType", label: "Institution type" },
    { key: "logo", label: "Institution logo", type: "photo", folder: "logo", shape: "logo" },
  ],
  admissions: [
    APPLICATION_WINDOW_TOGGLE,
    { key: "applicationOpen", label: "Applications open", type: "date", lockedWhenClosed: true },
    { key: "applicationClose", label: "Applications close", type: "date", lockedWhenClosed: true },
    { key: "applyUrl", label: "Application website", type: "url" },
    { key: "admissionsEmail", label: "Admissions email", type: "email" },
    { key: "admissionsPhone", label: "Admissions phone" },
  ],
  contact: [
    { key: "generalEmail", label: "General email", type: "email" },
    { key: "generalPhone", label: "General phone" },
    { key: "website", label: "Website URL", type: "url" },
    { key: "physicalAddress", label: "Physical address", span: "full" },
    ...SOCIAL_FIELDS,
  ],
  "student-life": [
    {
      key: "accommodationStatus",
      label: "Student accommodation",
      type: "toggle",
      onValue: ACCOMMODATION_ON,
      offValue: ACCOMMODATION_OFF,
      onLabel: "Available",
      offLabel: "Unavailable",
    },
    { ...ACCREDITATION_TOGGLE, key: "accreditationStatus", label: "Institution accreditation" },
    { key: "careerSupportDetails", label: "Career support details", type: "textarea", rows: 3 },
    { key: "healthDetails", label: "Health and wellbeing", type: "textarea", rows: 3 },
    { key: "safetyDetails", label: "Safety and security", type: "textarea", rows: 3 },
    { key: "sportsDetails", label: "Sport and recreation", type: "textarea", rows: 3 },
  ],
};

const FIELD_INPUT_CLASS = "mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm";

function formatLongDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function StatusPill({ on, label }) {
  return (
    <span
      className={[
        "mt-1.5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold",
        on ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600",
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full", on ? "bg-emerald-500" : "bg-slate-400"].join(" ")} />
      {label}
    </span>
  );
}

function ToggleSwitch({ on, onLabel, offLabel, onToggle }) {
  return (
    <div className="mt-1.5 flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={on ? onLabel : offLabel}
        onClick={() => onToggle(!on)}
        className={[
          "relative h-7 w-12 shrink-0 rounded-full transition",
          on ? "bg-emerald-500" : "bg-slate-300",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
            on ? "left-6" : "left-1",
          ].join(" ")}
        />
      </button>
      <span className="text-sm font-semibold text-slate-800">{on ? onLabel : offLabel}</span>
    </div>
  );
}

function PhotoPreview({ value, shape }) {
  if (!value) return <span className="mt-1.5 block text-sm text-slate-400">—</span>;
  return (
    <span
      className={[
        "mt-1.5 grid overflow-hidden border border-slate-200 bg-white",
        shape === "avatar" ? "h-16 w-16 rounded-full" : "h-24 w-24 rounded-2xl",
      ].join(" ")}
    >
      <img src={value} alt="" className="h-full w-full object-contain" />
    </span>
  );
}

function ReadOnlyValue({ field, value }) {
  const text = String(value ?? "").trim();
  if (field.type === "photo") return <PhotoPreview value={text} shape={field.shape} />;
  if (field.type === "toggle") {
    if (!text) return <span className="mt-1.5 block text-sm text-slate-400">Not set</span>;
    const on = text === field.onValue;
    return <StatusPill on={on} label={on ? field.onLabel : field.offLabel} />;
  }
  if (!text) return <span className="mt-1.5 block text-sm text-slate-400">—</span>;
  if (field.type === "url") {
    return (
      <a
        href={text}
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 block break-words text-sm font-medium text-brand-700 hover:text-brand-900"
      >
        {text}
      </a>
    );
  }
  if (field.type === "email") {
    return (
      <a href={`mailto:${text}`} className="mt-1.5 block break-words text-sm font-medium text-brand-700 hover:text-brand-900">
        {text}
      </a>
    );
  }
  return (
    <span className="mt-1.5 block whitespace-pre-line break-words text-sm text-slate-800">
      {field.type === "date" ? formatLongDate(text) : text}
    </span>
  );
}

function ProfileField({ field, value, editing, onChange, uploadFolder, note }) {
  const spanClass = field.span === "full" ? "md:col-span-2 2xl:col-span-3" : "";
  const inputType = field.type === "date" ? "date" : field.type === "email" ? "email" : "text";

  return (
    <div
      className={["min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3", spanClass].filter(Boolean).join(" ")}
    >
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{field.label}</dt>
      <dd>
        {editing ? (
          field.type === "toggle" ? (
            <ToggleSwitch
              on={value === field.onValue}
              onLabel={field.onLabel}
              offLabel={field.offLabel}
              onToggle={(next) => onChange(next ? field.onValue : field.offValue)}
            />
          ) : field.type === "photo" ? (
            <div className="mt-2">
              <PhotoUploadField
                value={value}
                onChange={onChange}
                folder={[uploadFolder, field.folder].filter(Boolean).join("/") || "general"}
                label={String(field.label || "photo").toLowerCase()}
                shape={field.shape}
              />
            </div>
          ) : field.type === "textarea" ? (
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              rows={field.rows || 3}
              className={FIELD_INPUT_CLASS}
              placeholder={field.label}
            />
          ) : (
            <input
              type={inputType}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className={FIELD_INPUT_CLASS}
              placeholder={field.label}
            />
          )
        ) : (
          <ReadOnlyValue field={field} value={value} />
        )}
        {note ? <p className="mt-1.5 text-xs text-slate-500">{note}</p> : null}
      </dd>
    </div>
  );
}

const CLOSED_DATES_NOTE = "Locked while applications are closed. Switch the window to Open to edit.";

function FieldGrid({ fields, form, editing, onChange, uploadFolder }) {
  // Deadlines stay read-only while the application window is closed.
  const windowClosed = !isApplicationWindowOpen(form.applicationWindowStatus);

  return (
    <dl className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {fields.map((field) => {
        const locked = Boolean(field.lockedWhenClosed) && windowClosed;
        return (
          <ProfileField
            key={field.key}
            field={field}
            value={form[field.key] || ""}
            editing={editing && !locked}
            onChange={(next) => onChange(field.key, next)}
            uploadFolder={uploadFolder}
            note={editing && locked ? CLOSED_DATES_NOTE : ""}
          />
        );
      })}
    </dl>
  );
}

function EditControls({ editing, locked, onEdit, onSave, onCancel }) {
  if (!editing) {
    return (
      <button
        type="button"
        onClick={onEdit}
        disabled={locked}
        className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
      >
        <Icon name="edit" className="h-4 w-4" />
        Edit
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        className="rounded-2xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
      >
        Save changes
      </button>
    </div>
  );
}

function EmptyRowsNote({ children }) {
  return (
    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">{children}</p>
  );
}

function CampusTab({ portal, editing, onChange, uploadFolder }) {
  const photos = splitMultilineList(portal.profileForm.campusPhotosText);

  return (
    <div className="space-y-5">
      <FormSection title="Campus photos" description="Shown in the photo strip on your public institution page.">
        {editing ? (
          <PhotoGalleryField
            value={photos}
            onChange={(urls) => onChange("campusPhotosText", urls.join("\n"))}
            folder={`${uploadFolder}/campus`}
          />
        ) : photos.length ? (
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {photos.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <img src={url} alt="" loading="lazy" className="h-32 w-full object-cover" />
              </a>
            ))}
          </div>
        ) : (
          <EmptyRowsNote>No campus photos yet.</EmptyRowsNote>
        )}
      </FormSection>

      <FormSection
        title="Resources"
        description="Prospectuses, fee schedules, and other links students can open."
        action={
          editing ? (
            <button
              type="button"
              onClick={() => portal.setResourceRows((rows) => [...rows, { ...EMPTY_RESOURCE }])}
              className="rounded-2xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900"
            >
              Add resource
            </button>
          ) : null
        }
      >
        {!portal.resourceRows.length ? <EmptyRowsNote>No resources published yet.</EmptyRowsNote> : null}

        {editing ? (
          <div className="space-y-3">
            {portal.resourceRows.map((row, index) => (
              <div
                key={`resource-${index}`}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2 2xl:grid-cols-4"
              >
                <input
                  value={row.title}
                  onChange={(event) =>
                    portal.setResourceRows((rows) =>
                      rows.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)),
                    )
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Title"
                />
                <input
                  value={row.category}
                  onChange={(event) =>
                    portal.setResourceRows((rows) =>
                      rows.map((item, i) => (i === index ? { ...item, category: event.target.value } : item)),
                    )
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Category"
                />
                <input
                  value={row.format}
                  onChange={(event) =>
                    portal.setResourceRows((rows) =>
                      rows.map((item, i) => (i === index ? { ...item, format: event.target.value } : item)),
                    )
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Format"
                />
                <input
                  value={row.url}
                  onChange={(event) =>
                    portal.setResourceRows((rows) =>
                      rows.map((item, i) => (i === index ? { ...item, url: event.target.value } : item)),
                    )
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() => portal.setResourceRows((rows) => rows.filter((_, i) => i !== index))}
                  className="text-left text-sm font-semibold text-red-700 md:col-span-2 2xl:col-span-4"
                >
                  Remove resource
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {portal.resourceRows.map((row, index) => (
              <div key={`resource-view-${index}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="font-semibold text-slate-900">{row.title || "Untitled resource"}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                  {[row.category, row.format].filter(Boolean).join(" · ") || "—"}
                </p>
                {row.url ? (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-words text-sm font-medium text-brand-700 hover:text-brand-900"
                  >
                    {row.url}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </FormSection>
    </div>
  );
}

function StudentLifeTab({ portal, editing, onChange }) {
  return (
    <div className="space-y-5">
      <FieldGrid fields={TAB_FIELDS["student-life"]} form={portal.profileForm} editing={editing} onChange={onChange} />

      <FormSection
        title="Student incentives"
        description="Optional support offers like bursaries, transport, WiFi, or devices."
        action={
          editing ? (
            <button
              type="button"
              onClick={() => portal.setStudentLifeRows((rows) => [...rows, { ...EMPTY_INCENTIVE }])}
              className="rounded-2xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900"
            >
              Add incentive
            </button>
          ) : null
        }
      >
        {!portal.studentLifeRows.length ? <EmptyRowsNote>No incentives listed yet.</EmptyRowsNote> : null}

        {editing ? (
          <div className="space-y-3">
            {portal.studentLifeRows.map((row, index) => (
              <div key={`incentive-${index}`} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
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
                  <input
                    value={row.sourceUrl}
                    onChange={(event) =>
                      portal.setStudentLifeRows((rows) =>
                        rows.map((item, i) => (i === index ? { ...item, sourceUrl: event.target.value } : item)),
                      )
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="Source URL"
                  />
                  <input
                    value={row.sourceLabel}
                    onChange={(event) =>
                      portal.setStudentLifeRows((rows) =>
                        rows.map((item, i) => (i === index ? { ...item, sourceLabel: event.target.value } : item)),
                      )
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="Source label"
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
        ) : (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {portal.studentLifeRows.map((row, index) => (
              <div key={`incentive-view-${index}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-brand-700">
                  {STUDENT_INCENTIVE_CATEGORY_META[row.category]?.label || "Other"}
                </p>
                <p className="mt-1 font-semibold text-slate-900">{row.label || "Untitled offer"}</p>
                {row.detail ? <p className="mt-1 text-sm text-slate-600">{row.detail}</p> : null}
                {row.sourceUrl ? (
                  <a
                    href={row.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-words text-sm font-medium text-brand-700 hover:text-brand-900"
                  >
                    {row.sourceLabel || row.sourceUrl}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </FormSection>
    </div>
  );
}

function StaffTab({ portal, editing, uploadFolder }) {
  return (
    <div className="space-y-5">
      <FormSection
        title="Public staff directory"
        description="Contacts students can reach out to from your institution page."
        action={
          editing ? (
            <button
              type="button"
              onClick={() => portal.setStaffRows((rows) => [...rows, { ...EMPTY_STAFF }])}
              className="rounded-2xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900"
            >
              Add person
            </button>
          ) : null
        }
      >
        {!portal.staffRows.length ? <EmptyRowsNote>No public staff contacts yet.</EmptyRowsNote> : null}

        {editing ? (
          <div className="space-y-3">
            {portal.staffRows.map((row, index) => (
              <div
                key={`staff-${index}`}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2 2xl:grid-cols-3"
              >
                <div className="md:col-span-2 2xl:col-span-3">
                  <PhotoUploadField
                    value={row.photo}
                    onChange={(url) =>
                      portal.setStaffRows((rows) => rows.map((item, i) => (i === index ? { ...item, photo: url } : item)))
                    }
                    folder={`${uploadFolder}/staff`}
                    label="photo"
                    shape="avatar"
                    hint="Optional headshot. JPG, PNG or WebP."
                  />
                </div>
                <input
                  value={row.name}
                  onChange={(event) =>
                    portal.setStaffRows((rows) =>
                      rows.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)),
                    )
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Full name"
                />
                <input
                  value={row.title}
                  onChange={(event) =>
                    portal.setStaffRows((rows) =>
                      rows.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)),
                    )
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
                    portal.setStaffRows((rows) =>
                      rows.map((item, i) => (i === index ? { ...item, email: event.target.value } : item)),
                    )
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Email"
                />
                <input
                  value={row.phone}
                  onChange={(event) =>
                    portal.setStaffRows((rows) =>
                      rows.map((item, i) => (i === index ? { ...item, phone: event.target.value } : item)),
                    )
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
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
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            {portal.staffRows.map((row, index) => (
              <div key={`staff-view-${index}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                {row.photo ? (
                  <img
                    src={row.photo}
                    alt=""
                    loading="lazy"
                    className="mb-2 h-14 w-14 rounded-full border border-slate-200 object-cover"
                  />
                ) : null}
                <p className="font-semibold text-slate-900">{row.name || "Unnamed"}</p>
                <p className="mt-1 text-sm text-slate-600">{[row.title, row.department].filter(Boolean).join(" · ") || "—"}</p>
                {row.email ? (
                  <a
                    href={`mailto:${row.email}`}
                    className="mt-2 block break-words text-sm font-medium text-brand-700 hover:text-brand-900"
                  >
                    {row.email}
                  </a>
                ) : null}
                {row.phone ? <p className="mt-1 text-sm text-slate-600">{row.phone}</p> : null}
              </div>
            ))}
          </div>
        )}
      </FormSection>

      <FormSection title="Portal access" description="Institution memberships already attached to the signed-in user.">
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {portal.memberships.map((membership) => (
            <div key={membership.institution_id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="font-semibold text-slate-900">{membership.institution_id}</p>
              <p className="mt-1 text-sm capitalize text-slate-600">{membership.role}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500">Full invite and permission workflows are planned next.</p>
      </FormSection>
    </div>
  );
}

function ProfilePage() {
  const portal = usePortal();
  useDocumentTitle("Profile | Institution Dashboard");
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingTab, setEditingTab] = useState(null);
  const [snapshot, setSnapshot] = useState(null);

  const requestedTab = searchParams.get("tab");
  const activeTab = PROFILE_TABS.some((tab) => tab.id === requestedTab) ? requestedTab : PROFILE_TABS[0].id;
  const activeTabMeta = PROFILE_TABS.find((tab) => tab.id === activeTab);
  const editingTabMeta = PROFILE_TABS.find((tab) => tab.id === editingTab);
  const editing = editingTab === activeTab;

  const previewHref = portal.activeInstitutionId
    ? buildAppUrl(`/universities/${portal.activeInstitutionId}`)
    : buildAppUrl("/universities");
  const uploadFolder = institutionAssetFolder(portal.activeInstitutionId);

  // Switching institutions reloads every form, so any in-flight edit no longer applies.
  useEffect(() => {
    setEditingTab(null);
    setSnapshot(null);
  }, [portal.activeInstitutionId]);

  function selectTab(tabId) {
    setSearchParams(tabId === PROFILE_TABS[0].id ? {} : { tab: tabId });
  }

  function updateField(key, value) {
    portal.setProfileForm((state) => ({ ...state, [key]: value }));
  }

  function startEditing() {
    setSnapshot({
      profileForm: portal.profileForm,
      resourceRows: portal.resourceRows,
      staffRows: portal.staffRows,
      studentLifeRows: portal.studentLifeRows,
    });
    setEditingTab(activeTab);
  }

  function cancelEditing() {
    if (snapshot) {
      portal.setProfileForm(snapshot.profileForm);
      portal.setResourceRows(snapshot.resourceRows);
      portal.setStaffRows(snapshot.staffRows);
      portal.setStudentLifeRows(snapshot.studentLifeRows);
    }
    setSnapshot(null);
    setEditingTab(null);
  }

  async function saveEditing() {
    const saved = editingTab === "staff" ? await portal.handleSaveStaff() : await portal.handleSaveProfile();
    if (!saved) return;
    setSnapshot(null);
    setEditingTab(null);
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-6 lg:px-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Institution profile</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">
            {portal.university?.name || "Your institution"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-2xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900">
            {portal.profileCompleteness.completed}/{portal.profileCompleteness.total} public profile areas complete
          </span>
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-200 hover:text-brand-900"
          >
            Preview in student app
          </a>
        </div>
      </div>

      {editingTab && editingTab !== activeTab ? (
        <div className="px-5 pt-4 lg:px-6">
          <button
            type="button"
            onClick={() => selectTab(editingTab)}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-left text-sm font-semibold text-amber-900"
          >
            Unsaved changes in {editingTabMeta?.label} — return to finish
          </button>
        </div>
      ) : null}

      <div className="mt-5 border-b border-slate-200 px-5 lg:px-6">
        <div role="tablist" aria-label="Profile sections" className="flex gap-6 overflow-x-auto">
          {PROFILE_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`profile-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`profile-panel-${tab.id}`}
                onClick={() => selectTab(tab.id)}
                className={[
                  "-mb-px whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-semibold transition",
                  isActive ? "border-brand-700 text-brand-800" : "border-transparent text-slate-500 hover:text-slate-800",
                ].join(" ")}
              >
                {tab.label}
                {editingTab === tab.id ? (
                  <span
                    aria-label="unsaved changes"
                    className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`profile-panel-${activeTab}`}
        aria-labelledby={`profile-tab-${activeTab}`}
        className="space-y-5 px-5 py-6 lg:px-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-semibold text-slate-900">{activeTabMeta?.label}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {editing ? "Editing — changes publish when you save." : activeTabMeta?.hint}
            </p>
          </div>
          <EditControls
            editing={editing}
            locked={Boolean(editingTab) && !editing}
            onEdit={startEditing}
            onSave={saveEditing}
            onCancel={cancelEditing}
          />
        </div>

        {activeTab === "campus" ? (
          <CampusTab portal={portal} editing={editing} onChange={updateField} uploadFolder={uploadFolder} />
        ) : activeTab === "student-life" ? (
          <StudentLifeTab portal={portal} editing={editing} onChange={updateField} />
        ) : activeTab === "staff" ? (
          <StaffTab portal={portal} editing={editing} uploadFolder={uploadFolder} />
        ) : (
          <FieldGrid
            fields={TAB_FIELDS[activeTab]}
            form={portal.profileForm}
            editing={editing}
            onChange={updateField}
            uploadFolder={uploadFolder}
          />
        )}
      </div>
    </section>
  );
}

const PROGRAMME_FIELDS = [
  { key: "description", label: "Programme description", type: "textarea", rows: 5, span: "full" },
  { key: "applyUrl", label: "External application link", type: "url" },
  { key: "officialUrl", label: "Official programme page", type: "url" },
  APPLICATION_WINDOW_TOGGLE,
  { key: "applicationDeadline", label: "Application deadline", type: "date", lockedWhenClosed: true },
  { key: "minPoints", label: "Minimum points" },
  { ...ACCREDITATION_TOGGLE, key: "accreditationStatus", label: "Programme accreditation" },
  { key: "careers", label: "Career outcomes (one per line)", type: "textarea", rows: 4 },
  { key: "jobOpportunities", label: "Common jobs after graduation (one per line)", type: "textarea", rows: 4 },
];

function ProgrammesPage() {
  const portal = usePortal();
  useDocumentTitle("Programmes | Institution Dashboard");
  const [editing, setEditing] = useState(false);
  const [snapshot, setSnapshot] = useState(null);

  const feeField = {
    key: "feesDomestic",
    label: `Domestic fees (${defaultCurrencyForCountry(portal.university?.country)})`,
  };

  // Changing the selected programme swaps the whole form out from under an edit.
  useEffect(() => {
    setEditing(false);
    setSnapshot(null);
  }, [portal.selectedProgrammeId]);

  function updateField(key, value) {
    portal.setProgrammeForm((state) => ({ ...state, [key]: value }));
  }

  function startEditing() {
    setSnapshot(portal.programmeForm);
    setEditing(true);
  }

  function cancelEditing() {
    if (snapshot) portal.setProgrammeForm(snapshot);
    setSnapshot(null);
    setEditing(false);
  }

  async function saveEditing() {
    const saved = await portal.handleSaveProgramme();
    if (!saved) return;
    setSnapshot(null);
    setEditing(false);
  }

  return (
    <div className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Programmes</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">Manage institution programmes</h2>
          <p className="mt-1 text-sm text-slate-600">
            {editing ? "Editing — changes publish when you save." : "Pick a programme to review what students currently see."}
          </p>
        </div>
        {portal.selectedProgrammeId ? (
          <EditControls editing={editing} locked={false} onEdit={startEditing} onSave={saveEditing} onCancel={cancelEditing} />
        ) : null}
      </div>

      <select
        value={portal.selectedProgrammeId}
        onChange={(event) => portal.fillProgrammeForm(event.target.value)}
        aria-label="Select programme"
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm lg:max-w-md"
      >
        <option value="">Select programme</option>
        {portal.institutionProgrammes.map((programme) => (
          <option key={programme.id} value={programme.id}>
            {programme.name}
          </option>
        ))}
      </select>

      {portal.selectedProgrammeId ? (
        <>
          <FieldGrid
            fields={[...PROGRAMME_FIELDS, feeField]}
            form={portal.programmeForm}
            editing={editing}
            onChange={updateField}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Scholarship, media, SEO, and richer statistics panels are reserved spaces in this first release.
            </div>
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Views, saves, shares, and applications will populate here as the remaining analytics surfaces go live.
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">Choose a programme to edit its public details, deadlines, and CTA links.</p>
      )}
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
      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
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
            <pre className="mt-4 overflow-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">
              {JSON.stringify(lead.payload, null, 2)}
            </pre>
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
      </div>
      {!portal.leads.length ? <p className="text-sm text-slate-500">No leads yet.</p> : null}
    </div>
  );
}

function ClaimPage() {
  const portal = usePortal();
  useDocumentTitle("Claim profile | Institution Dashboard");

  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
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

function StubPage({ title, description, icon = "faq" }) {
  useDocumentTitle(`${title} | Institution Dashboard`);
  return (
    <div className="grid min-h-[60vh] place-items-center rounded-[2rem] border border-dashed border-slate-300 bg-white p-6 shadow-card">
      <div className="max-w-2xl text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-brand-50 text-brand-800">
          <Icon name={icon} className="h-7 w-7" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Coming soon</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
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

function FormSection({ title, description, action, children }) {
  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
        {action}
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
          <Route path="staff" element={<Navigate to="/profile?tab=staff" replace />} />
          <Route path="programmes" element={<ProgrammesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route
            path="feed"
            element={
              <StubPage
                title="Feed"
                icon="feed"
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
                icon="settings"
                description="Branding, notification, and integration controls live here. Settings sits at the bottom of the sidebar, separate from the primary content sections."
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
