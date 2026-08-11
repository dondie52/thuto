import { DEFAULT_MARKET_COUNTRY, normalizeMarketCountry, marketCountryLabel } from "./marketCountry.js";

/** ISO currency codes by study-market country. */
export const MARKET_CURRENCY = {
  bw: "BWP",
  na: "NAD",
  zw: "USD",
  zm: "ZMW",
  za: "ZAR",
  ls: "LSL",
  sz: "SZL",
};

/**
 * @param {string | null | undefined} country
 * @returns {string}
 */
export function defaultCurrencyForCountry(country) {
  const code = normalizeMarketCountry(country) || DEFAULT_MARKET_COUNTRY;
  return MARKET_CURRENCY[code] || "BWP";
}

/**
 * Resolve display currency: explicit fee/schedule currency → institution country → active market → BWP.
 * @param {{ currency?: string | null, country?: string | null } | null | undefined} item
 * @param {string | null | undefined} [marketCountry]
 */
export function resolveDisplayCurrency(item, marketCountry) {
  const explicit = String(item?.currency || "").trim().toUpperCase();
  if (explicit) return explicit;
  if (item?.country) return defaultCurrencyForCountry(item.country);
  return defaultCurrencyForCountry(marketCountry);
}

/** Sponsorship / funding intent options by market. */
export const SPONSORSHIP_BY_COUNTRY = {
  bw: [
    { value: "dtef", label: "DTEF (Government) Sponsorship" },
    { value: "private", label: "Private / Corporate Funding" },
    { value: "self_funded", label: "Self-Funded" },
  ],
  na: [
    { value: "nsfaf", label: "NSFAF (Government) Funding" },
    { value: "private", label: "Private / Corporate Funding" },
    { value: "self_funded", label: "Self-Funded" },
  ],
  zw: [
    { value: "gov_zw", label: "Government / Cadetship Funding" },
    { value: "private", label: "Private / Corporate Funding" },
    { value: "self_funded", label: "Self-Funded" },
  ],
  zm: [
    { value: "helsb", label: "HELSB (Government) Loan / Bursary" },
    { value: "private", label: "Private / Corporate Funding" },
    { value: "self_funded", label: "Self-Funded" },
  ],
  za: [
    { value: "nsfas", label: "NSFAS (Government) Funding" },
    { value: "private", label: "Private / Corporate Funding" },
    { value: "self_funded", label: "Self-Funded" },
  ],
  ls: [
    { value: "nmds", label: "NMDS (Government) Bursary/Loan" },
    { value: "private", label: "Private / Corporate Funding" },
    { value: "self_funded", label: "Self-Funded" },
  ],
  sz: [
    { value: "gov_sz", label: "Government Scholarship (Min. of Education and Training)" },
    { value: "private", label: "Private / Corporate Funding" },
    { value: "self_funded", label: "Self-Funded" },
  ],
};

export const ALL_SPONSORSHIP_VALUES = [
  ...new Set(Object.values(SPONSORSHIP_BY_COUNTRY).flatMap((opts) => opts.map((o) => o.value))),
];

/**
 * @param {string | null | undefined} country
 */
export function sponsorshipOptionsForCountry(country) {
  const code = normalizeMarketCountry(country) || DEFAULT_MARKET_COUNTRY;
  return SPONSORSHIP_BY_COUNTRY[code] || SPONSORSHIP_BY_COUNTRY.bw;
}

/**
 * Government funding copy for the Sponsorships page (by study destination).
 * Botswana keeps richer DTEF detail; other markets use lighter official-portal guidance.
 */
export const GOVERNMENT_FUNDING_BY_COUNTRY = {
  bw: {
    schemeLabel: "DTEF",
    fundingRouteTitle: "Government sponsorship",
    fundingRouteBody:
      "Public windows and required documents for national sponsorship schemes, including the DTEF online portal for new students.",
    portalUrl: "https://tef.gov.bw",
    kicker: "Botswana — DTEF",
    heading: "Tertiary education government sponsorship",
    subheading: "New students — public application summary",
    intro:
      "The steps below summarise the public application process for Botswana’s Online Tertiary Education Sponsorship portal. Always confirm deadlines and requirements on the official site or with DTEF before you act.",
    portalButtonLabel: "Open official portal",
    warningTitle: "Website security",
    warningBody:
      "Browsers may warn you if the portal certificate is expired or invalid. If you see a security warning, avoid entering passwords until the site is fixed or use official contact numbers to confirm how applicants should proceed.",
    contactsHeading: "For enquiries",
    contactsNote: "Prefer the official portal and published call-centre numbers; details change each intake.",
    contacts: [
      { label: "Toll-free", detail: "0800 600 185", tel: "tel:+267800600185" },
      { label: "Call centre", detail: "371 9364", tel: "tel:+2673719364" },
    ],
    stepsHeading: "Application steps",
    steps: [
      { title: "Create an account", body: "Sign up on the Online Tertiary Education Sponsorship portal with a valid email." },
      { title: "Verify and sign in", body: "Confirm your email, set a password, then sign in." },
      { title: "Apply as a new student", body: "Complete the new-student application and upload supporting documents." },
      { title: "Submit and track", body: "Review, submit, then check status under Submissions on the portal." },
    ],
    verifyBody:
      "Sponsorship rules change. Cross-check every detail with official DTEF notices, the live portal, or the call centre.",
  },
  na: {
    schemeLabel: "NSFAF",
    fundingRouteTitle: "Government funding",
    fundingRouteBody:
      "Namibia Students Financial Assistance Fund (NSFAF) and related public funding windows for tertiary study.",
    portalUrl: "https://www.nsfaf.na/",
    kicker: "Namibia — NSFAF",
    heading: "NSFAF student funding",
    subheading: "Guidance only — confirm each intake on the official NSFAF site",
    intro:
      "NSFAF administers government financial assistance for eligible Namibian students. Application windows, programmes covered, and documents change by intake — use the official portal as the source of truth.",
    portalButtonLabel: "Open NSFAF site",
    warningTitle: "Verify before you apply",
    warningBody:
      "Only use official NSFAF channels. Thuto does not submit applications or confirm eligibility.",
    contactsHeading: "Next steps",
    contactsNote: "Contact details and helpdesk hours are published on the NSFAF website.",
    contacts: [{ label: "Official site", detail: "nsfaf.na", tel: "" }],
    stepsHeading: "Typical path",
    steps: [
      { title: "Check eligibility", body: "Confirm citizenship, institution, and programme rules for the current intake." },
      { title: "Prepare documents", body: "Gather ID, academic results, and any forms listed on the NSFAF portal." },
      { title: "Apply online", body: "Submit through the official NSFAF application channel before the deadline." },
      { title: "Track outcomes", body: "Follow portal status updates and any award acceptance steps." },
    ],
    verifyBody: "Cross-check every requirement with NSFAF notices for the intake year you are applying in.",
  },
  zw: {
    schemeLabel: "Government / cadetship",
    fundingRouteTitle: "Government funding",
    fundingRouteBody:
      "Government, cadetship, and public-sector funding routes where published for Zimbabwe tertiary study.",
    portalUrl: "",
    kicker: "Zimbabwe — public funding",
    heading: "Government and cadetship funding",
    subheading: "Guidance only — schemes vary by ministry and intake",
    intro:
      "Zimbabwe funding routes are often published by ministries, cadetship programmes, or institutions rather than a single national portal. Confirm the current window with the relevant authority and your university.",
    portalButtonLabel: "Browse universities",
    warningTitle: "No single national portal",
    warningBody:
      "Thuto does not list a live Zimbabwe government sponsorship portal. Prefer official ministry or institution notices.",
    contactsHeading: "Where to look",
    contactsNote: "Start with your chosen university’s student finance office and official government notices.",
    contacts: [{ label: "Universities", detail: "Check institution funding pages in Thuto", tel: "" }],
    stepsHeading: "Typical path",
    steps: [
      { title: "Identify the scheme", body: "Confirm whether funding is ministry, cadetship, or institution-linked." },
      { title: "Match programme rules", body: "Check subject and grade requirements for the award." },
      { title: "Apply via official channel", body: "Use only the published form or portal for that scheme." },
      { title: "Keep records", body: "Save acknowledgements and deadlines for follow-up." },
    ],
    verifyBody: "Verify every detail with the publishing ministry or institution before you rely on it.",
  },
  zm: {
    schemeLabel: "HELSB",
    fundingRouteTitle: "Government loan / bursary",
    fundingRouteBody:
      "Higher Education Loans and Scholarships Board (HELSB) and related public funding for Zambia.",
    portalUrl: "https://www.helsb.gov.zm/",
    kicker: "Zambia — HELSB",
    heading: "HELSB loans and scholarships",
    subheading: "Guidance only — confirm each intake on the official HELSB site",
    intro:
      "HELSB administers government student loans and scholarships for eligible Zambian students. Windows, covered institutions, and documents change by year — use the official site as the source of truth.",
    portalButtonLabel: "Open HELSB site",
    warningTitle: "Verify before you apply",
    warningBody: "Only use official HELSB channels. Thuto does not submit applications or confirm eligibility.",
    contactsHeading: "Next steps",
    contactsNote: "Helpdesk and regional office details are published on the HELSB website.",
    contacts: [{ label: "Official site", detail: "helsb.gov.zm", tel: "" }],
    stepsHeading: "Typical path",
    steps: [
      { title: "Confirm eligibility", body: "Check citizenship, institution accreditation, and programme coverage." },
      { title: "Gather documents", body: "Prepare ID, results, and any forms listed for the intake." },
      { title: "Apply online", body: "Submit through the official HELSB application process." },
      { title: "Track and accept", body: "Follow portal status and any loan/bursary acceptance steps." },
    ],
    verifyBody: "Cross-check requirements with HELSB notices for the year you are applying in.",
  },
  za: {
    schemeLabel: "NSFAS",
    fundingRouteTitle: "Government funding",
    fundingRouteBody:
      "National Student Financial Aid Scheme (NSFAS) and related public funding for South African study.",
    portalUrl: "https://www.nsfas.org.za/",
    kicker: "South Africa — NSFAS",
    heading: "NSFAS student funding",
    subheading: "Guidance only — confirm each intake on the official NSFAS site",
    intro:
      "NSFAS funds eligible South African students at qualifying public institutions. Application windows, means tests, and covered programmes change by year — use the official NSFAS site as the source of truth.",
    portalButtonLabel: "Open NSFAS site",
    warningTitle: "Verify before you apply",
    warningBody: "Only use official NSFAS channels. Thuto does not submit applications or confirm eligibility.",
    contactsHeading: "Next steps",
    contactsNote: "Contact centres and myNSFAS help are published on the NSFAS website.",
    contacts: [{ label: "Official site", detail: "nsfas.org.za", tel: "" }],
    stepsHeading: "Typical path",
    steps: [
      { title: "Check eligibility", body: "Confirm citizenship/residency, institution type, and income rules for the intake." },
      { title: "Create / update myNSFAS", body: "Register or sign in on the official NSFAS portal." },
      { title: "Submit the application", body: "Upload required documents before the published deadline." },
      { title: "Track funding status", body: "Follow portal updates and institution registration steps if funded." },
    ],
    verifyBody: "Cross-check every requirement with NSFAS notices for the funding year you are applying in.",
  },
  ls: {
    schemeLabel: "NMDS",
    fundingRouteTitle: "Government bursary / loan",
    fundingRouteBody:
      "National Manpower Development Secretariat (NMDS) bursaries and loans and related public funding for Lesotho tertiary study.",
    portalUrl: "",
    kicker: "Lesotho — NMDS",
    heading: "NMDS student bursaries and loans",
    subheading: "Guidance only — confirm each intake with NMDS",
    intro:
      "NMDS administers government bursaries and loans for eligible Basotho students. Windows, covered institutions, and documents change by year — confirm directly with NMDS or the Ministry of Education and Training before you rely on any detail here.",
    portalButtonLabel: "Browse universities",
    warningTitle: "No live portal listed",
    warningBody: "Thuto does not list a live NMDS application portal. Prefer official NMDS or ministry notices.",
    contactsHeading: "Where to look",
    contactsNote: "Start with the NMDS office and official Ministry of Education and Training notices.",
    contacts: [{ label: "NMDS", detail: "Ministry of Education and Training, Lesotho", tel: "" }],
    stepsHeading: "Typical path",
    steps: [
      { title: "Confirm eligibility", body: "Check citizenship, institution, and programme rules for the current intake." },
      { title: "Gather documents", body: "Prepare ID, academic results, and any forms required by NMDS." },
      { title: "Apply through NMDS", body: "Submit through the official NMDS application process before the deadline." },
      { title: "Track outcomes", body: "Follow up with NMDS on award status and any acceptance steps." },
    ],
    verifyBody: "Cross-check every requirement with NMDS or Ministry of Education and Training notices for the intake year you are applying in.",
  },
  sz: {
    schemeLabel: "Government scholarship",
    fundingRouteTitle: "Government scholarship",
    fundingRouteBody:
      "Ministry of Education and Training (Higher Education Scholarships) government scholarships and related public funding for Eswatini tertiary study.",
    portalUrl: "",
    kicker: "Eswatini — government scholarship",
    heading: "Government scholarship funding",
    subheading: "Guidance only — confirm each intake with the Ministry of Education and Training",
    intro:
      "The Eswatini government scholarship scheme funds eligible students at accredited institutions. Windows, covered institutions, and documents change by year — confirm directly with the Ministry of Education and Training before you rely on any detail here.",
    portalButtonLabel: "Browse universities",
    warningTitle: "No live portal listed",
    warningBody:
      "Thuto does not list a live Eswatini government scholarship portal. Prefer official Ministry of Education and Training notices.",
    contactsHeading: "Where to look",
    contactsNote: "Start with the Ministry of Education and Training and official scholarship office notices.",
    contacts: [{ label: "Ministry of Education and Training", detail: "Government of Eswatini", tel: "" }],
    stepsHeading: "Typical path",
    steps: [
      { title: "Confirm eligibility", body: "Check citizenship, institution accreditation (ESHEC), and programme rules for the current intake." },
      { title: "Gather documents", body: "Prepare ID, academic results, and any forms required by the scholarship office." },
      { title: "Apply through the ministry", body: "Submit through the official scholarship application process before the deadline." },
      { title: "Track outcomes", body: "Follow up with the ministry on award status and any acceptance steps." },
    ],
    verifyBody: "Cross-check every requirement with Ministry of Education and Training notices for the intake year you are applying in.",
  },
};

/**
 * @param {string | null | undefined} country
 */
export function governmentFundingForCountry(country) {
  const code = normalizeMarketCountry(country) || DEFAULT_MARKET_COUNTRY;
  return GOVERNMENT_FUNDING_BY_COUNTRY[code] || GOVERNMENT_FUNDING_BY_COUNTRY.bw;
}

/**
 * Default international-applicant guidance by destination market.
 * University-level `internationalApplicants` overrides when present.
 */
export const INTERNATIONAL_GUIDANCE_BY_COUNTRY = {
  bw: {
    title: "International applicants",
    summary:
      "Students applying from outside Botswana typically need a study permit and should confirm entry requirements and fee categories with the institution.",
    steps: [
      "Check the programme page for academic entry requirements and whether an international fee rate applies.",
      "Prepare certified academic transcripts and identity documents for the university application.",
      "After an offer (or as required), apply for a Botswana study permit via official immigration channels.",
      "Confirm registration, medical aid, and arrival deadlines on the university website.",
    ],
    links: [
      {
        title: "Botswana Department of Immigration and Citizenship",
        url: "https://www.gov.bw/ministries/ministry-nationality-immigration-and-gender-affairs",
      },
    ],
  },
  na: {
    title: "International applicants",
    summary:
      "Applicants from outside Namibia should verify NQA-related entry requirements, fee categories, and study permit steps with the institution and Namibian immigration.",
    steps: [
      "Confirm programme accreditation and entry requirements with the institution.",
      "Ask whether tuition is quoted for Namibian citizens, SADC, or other international rates.",
      "Prepare certified transcripts and apply for a study permit if required.",
      "Verify registration and arrival instructions on the official website.",
    ],
    links: [
      {
        title: "Namibia Ministry of Home Affairs, Immigration, Safety and Security",
        url: "https://mha.gov.na/",
      },
    ],
  },
  zw: {
    title: "International applicants",
    summary:
      "International applicants to Zimbabwean universities should confirm ZIMCHE programme status, entry requirements, and study permit guidance with the institution.",
    steps: [
      "Review programme requirements (often ZIMSEC or equivalent A-Level / O-Level).",
      "Confirm fee category for international students.",
      "Gather certified documents and follow the university’s application process.",
      "Check study permit / immigration requirements for Zimbabwe.",
    ],
    links: [],
  },
  zm: {
    title: "International applicants",
    summary:
      "International applicants should confirm HEA-accredited programmes, entry requirements, and study permit steps with the institution and Zambian authorities.",
    steps: [
      "Verify the programme appears on the HEA accredited list where relevant.",
      "Confirm tuition currency and international fee rates.",
      "Submit certified academic documents through the institution’s application channel.",
      "Follow official guidance for a Zambia study permit if required.",
    ],
    links: [
      {
        title: "Higher Education Authority (Zambia)",
        url: "https://www.hea.org.zm/",
      },
    ],
  },
  za: {
    title: "International applicants",
    summary:
      "International applicants to South African institutions typically need a study visa and should confirm APS/matric equivalents, fee categories, and DHET registration status.",
    steps: [
      "Confirm the institution is registered/accredited for the qualification you want.",
      "Check APS or equivalent entry requirements and whether international fee rates apply.",
      "Apply to the institution, then follow study visa steps with Home Affairs if required.",
      "Arrange medical cover and arrival registration as directed by the institution.",
    ],
    links: [
      {
        title: "South Africa Department of Home Affairs — visas",
        url: "https://www.dha.gov.za/",
      },
      {
        title: "DHET — private higher education register",
        url: "https://www.dhet.gov.za/",
      },
    ],
  },
  ls: {
    title: "International applicants",
    summary:
      "International applicants to Lesotho institutions should confirm Council on Higher Education (CHE) accreditation, entry requirements, and study permit steps with the institution and Lesotho immigration.",
    steps: [
      "Confirm the institution and programme are CHE-accredited.",
      "Check entry requirements and whether an international fee rate applies.",
      "Prepare certified academic transcripts and identity documents for the application.",
      "Apply for a Lesotho study/residence permit via official immigration channels if required.",
    ],
    links: [
      {
        title: "Lesotho Council on Higher Education (CHE)",
        url: "https://che.org.ls/",
      },
    ],
  },
  sz: {
    title: "International applicants",
    summary:
      "International applicants to Eswatini institutions should confirm Eswatini Higher Education Council (ESHEC) registration/accreditation, entry requirements, and study permit steps with the institution and Eswatini immigration.",
    steps: [
      "Confirm the institution and programme are ESHEC-registered/accredited.",
      "Check entry requirements and whether an international fee rate applies.",
      "Prepare certified academic transcripts and identity documents for the application.",
      "Apply for an Eswatini study/residence permit via official immigration channels if required.",
    ],
    links: [
      {
        title: "Eswatini Higher Education Council (ESHEC)",
        url: "https://eshec.org.sz/",
      },
    ],
  },
};

/**
 * @param {Record<string, unknown> | null | undefined} university
 * @param {string | null | undefined} [marketCountry]
 */
export function resolveInternationalGuidance(university, marketCountry) {
  const country =
    normalizeMarketCountry(university?.country) ||
    normalizeMarketCountry(marketCountry) ||
    DEFAULT_MARKET_COUNTRY;
  const defaults = INTERNATIONAL_GUIDANCE_BY_COUNTRY[country] || INTERNATIONAL_GUIDANCE_BY_COUNTRY.bw;
  const override = university?.internationalApplicants;
  if (!override || typeof override !== "object") {
    return { ...defaults, country, countryLabel: marketCountryLabel(country) };
  }
  return {
    title: override.title || defaults.title,
    summary: override.summary || defaults.summary,
    steps: Array.isArray(override.steps) && override.steps.length ? override.steps : defaults.steps,
    links: Array.isArray(override.links) && override.links.length ? override.links : defaults.links,
    country,
    countryLabel: marketCountryLabel(country),
  };
}
