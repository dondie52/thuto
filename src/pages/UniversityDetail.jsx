import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import InstitutionCampaignBanner from "../components/InstitutionCampaignBanner.jsx";
import UniversityApplicationBlock from "../components/UniversityApplicationBlock.jsx";
import InstitutionVerificationBadge from "../components/InstitutionVerificationBadge.jsx";
import LeadInquiryForm from "../components/LeadInquiryForm.jsx";
import { fetchUniversities } from "../lib/universitiesData.js";
import { fetchProgrammes, programmeBelongsToUniversity } from "../lib/programmesData.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { fetchVerifiedInstitutionIds } from "../lib/partner.js";
import { trackInstitutionView } from "../lib/analytics.js";
import { buildTrackedApplyUrl } from "../lib/applyLinks.js";
import UniversityInitialsBadge from "../components/UniversityInitialsBadge.jsx";
import ExternalSiteLink from "../components/ExternalSiteLink.jsx";
import { safeExternalUrl, isAllowedExternalResourceUrl, externalHostname } from "../lib/urlSafety.js";
import ProgrammeThemeAccent from "../components/ProgrammeThemeAccent.jsx";
import ShowMoreButton from "../components/ShowMoreButton.jsx";
import { availabilityLabel, facilityMeta, sportMeta } from "../lib/campusFacilities.js";
import UniversityReviews from "../components/UniversityReviews.jsx";
import { publishedInstitutionFaqs } from "../lib/institutionFaqs.js";
import { useCollapsibleList } from "../hooks/useCollapsibleList.js";
import UniversityStudentIncentives from "../components/UniversityStudentIncentives.jsx";
import UniversityFacultyFeesSection from "../components/UniversityFacultyFeesSection.jsx";
import InternationalApplicantsSection from "../components/InternationalApplicantsSection.jsx";
import { resolveMarketCountry } from "../lib/marketCountry.js";
import {
  UNIVERSITY_SOCIAL_PLATFORMS,
  getUniversityTypeLabel,
  normalizeUniversityAccreditation,
  normalizeUniversityCampusPhotos,
  normalizeUniversityContacts,
  normalizeUniversitySocialLinks,
  normalizeUniversityStudentLife,
  displayFacultyName,
  normalizeUniversityAdmissions,
  openStateLabel,
} from "../lib/institutionProfile.js";
import { resolveProgrammeThemeUrl } from "../lib/programmeBranding.js";

const PROGRAMMES_PREVIEW = 8;

function normalizeResources(resources) {
  if (!Array.isArray(resources)) return [];
  return resources
    .map((resource) => ({
      ...resource,
      href: isAllowedExternalResourceUrl(resource?.url) ? safeExternalUrl(resource?.url) : "",
    }))
    .filter((resource) => resource?.title && resource.href);
}

function institutionShortName(university) {
  return university?.shortName || university?.name || "institution";
}

function resourceActionLabel(resource, university) {
  const short = institutionShortName(university);
  if (isPdfResource(resource)) return `Get from ${short}`;
  const host = externalHostname(resource.href);
  return host ? `Open on ${host}` : "Open official page";
}

function isPdfResource(resource) {
  const format = String(resource?.format || "").toLowerCase();
  const url = String(resource?.url || resource?.href || "").toLowerCase();
  return format.includes("pdf") || url.includes(".pdf");
}

function socialLabel(platformKey) {
  return UNIVERSITY_SOCIAL_PLATFORMS.find((item) => item.key === platformKey)?.label || platformKey;
}

function UniversityResourcesSection({ university, resources }) {
  const websiteHref = safeExternalUrl(university.website);
  const applyHref = safeExternalUrl(university.applyUrl);
  const hasResources = resources.length > 0;
  const categories = [...new Set(resources.map((resource) => resource.category).filter(Boolean))];

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-brand-900">Official resources</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Hosted on the institution&apos;s website — Thuto does not store these files.
          </p>
        </div>
        {hasResources ? (
          <p className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
            {resources.length} {resources.length === 1 ? "resource" : "resources"}
          </p>
        ) : null}
      </div>

      {!hasResources ? (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <p className="text-sm leading-relaxed text-slate-600">
            Official brochures, prospectuses and application guides will appear here when available. Use the links below to
            visit the institution&apos;s website or apply.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {websiteHref ? (
              <ExternalSiteLink
                href={websiteHref}
                variant="secondary"
                institutionName={university.name}
                institutionId={university.id}
                linkKind="website"
                useInterstitial
              >
                Official website
              </ExternalSiteLink>
            ) : null}
            {applyHref && applyHref !== websiteHref ? (
              <ExternalSiteLink
                href={applyHref}
                variant="primary"
                institutionName={university.name}
                institutionId={university.id}
                linkKind="apply"
                useInterstitial
              >
                Apply online
              </ExternalSiteLink>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          {categories.length ? (
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Resource categories">
              {categories.map((category) => (
                <span key={category} className="rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold text-brand-800">
                  {category}
                </span>
              ))}
            </div>
          ) : null}

          <ul className="mt-4 grid gap-3">
            {resources.map((resource) => (
              <li key={`${resource.title}-${resource.url}`}>
                <div className="group flex min-w-0 flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3 text-sm transition hover:border-brand-300 hover:bg-brand-50 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex min-w-0 items-start gap-2 sm:items-center">
                    {isPdfResource(resource) ? (
                      <span
                        className="mt-0.5 inline-flex shrink-0 rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 sm:mt-0"
                        aria-hidden
                      >
                        PDF
                      </span>
                    ) : null}
                    <span className="min-w-0">
                      <span className="block break-words font-semibold text-brand-900">{resource.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                        {[resource.category, resource.format, resource.sourceLabel].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </span>
                  <ExternalSiteLink
                    href={resource.href}
                    variant="primary"
                    institutionName={university.name}
                    institutionId={university.id}
                    linkKind="resource"
                    useInterstitial
                    documentNotice={isPdfResource(resource)}
                  >
                    {resourceActionLabel(resource, university)}
                  </ExternalSiteLink>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Links open the institution&apos;s official site in your browser. Files and dates may change — verify before
            you apply.
          </p>
        </>
      )}
    </section>
  );
}


export default function UniversityDetail() {
  const { id } = useParams();
  const [university, setUniversity] = useState(null);
  const [programmes, setProgrammes] = useState([]);
  const [error, setError] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    fetchUniversities({ signal: ac.signal })
      .then(({ list }) => {
        if (cancelled) return;
        const found = list.find((u) => u.id === id);
        if (!found) setError("Institution not found.");
        else setUniversity(found);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Load failed");
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [id]);

  useEffect(() => {
    fetchVerifiedInstitutionIds().then((ids) => setIsVerified(ids.has(id)));
  }, [id]);

  useEffect(() => {
    if (university) trackInstitutionView(university);
  }, [university?.id]);

  useEffect(() => {
    let cancelled = false;
    fetchProgrammes()
      .then((list) => {
        if (!cancelled) setProgrammes(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Load failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const documentTitle = error
    ? "University not found - Thuto"
    : university
      ? `${university.name} | Thuto`
      : "University - Thuto";
  useDocumentTitle(documentTitle);

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-800">{error}</p>
        <Link to="/universities" className="text-sm font-medium text-brand-700 underline">
          Back to universities
        </Link>
      </div>
    );
  }

  if (!university) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  const resources = normalizeResources(university.resources);
  const admissions = normalizeUniversityAdmissions(university);
  const faqs = publishedInstitutionFaqs(university.faqs);
  const websiteHref = safeExternalUrl(university.website);
  const contacts = normalizeUniversityContacts(university);
  const accreditation = normalizeUniversityAccreditation(university);
  const socialLinks = normalizeUniversitySocialLinks(university);
  const campusPhotos = normalizeUniversityCampusPhotos(university);
  const studentLife = normalizeUniversityStudentLife(university);
  const socialEntries = Object.entries(socialLinks).filter(([, href]) => safeExternalUrl(href));

  return (
    <article className="space-y-6">
      <Link to="/universities" className="inline-block text-sm font-medium text-brand-700 hover:underline">
        ← Tertiary Institutions
      </Link>

      <header className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-white p-3 shadow-sm">
            <UniversityInitialsBadge university={university} size="md" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold text-brand-900 sm:text-2xl">{university.name}</h1>
              {isVerified ? <InstitutionVerificationBadge /> : null}
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">{getUniversityTypeLabel(university)}</span>
              {accreditation.status ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {accreditation.status}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm font-medium text-brand-600">{university.location}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{university.description}</p>
        <dl className="mt-4 grid gap-3 border-t border-brand-100 pt-4 text-sm text-slate-600 sm:grid-cols-2">
          {contacts.address ? (
            <div>
              <dt className="text-xs font-medium text-slate-500">Physical address</dt>
              <dd>{contacts.address}</dd>
            </div>
          ) : null}
          {contacts.generalPhone && (
            <div>
              <dt className="text-xs font-medium text-slate-500">General phone</dt>
              <dd>
                <a href={`tel:${String(contacts.generalPhone).replace(/\s/g, "")}`} className="text-brand-700 hover:underline">
                  {contacts.generalPhone}
                </a>
              </dd>
            </div>
          )}
          {contacts.admissionsPhone ? (
            <div>
              <dt className="text-xs font-medium text-slate-500">Admissions phone</dt>
              <dd>
                <a href={`tel:${String(contacts.admissionsPhone).replace(/\s/g, "")}`} className="text-brand-700 hover:underline">
                  {contacts.admissionsPhone}
                </a>
              </dd>
            </div>
          ) : null}
          {contacts.generalEmail ? (
            <div>
              <dt className="text-xs font-medium text-slate-500">General email</dt>
              <dd>
                <a href={`mailto:${contacts.generalEmail}`} className="text-brand-700 hover:underline">
                  {contacts.generalEmail}
                </a>
              </dd>
            </div>
          ) : null}
          {contacts.admissionsEmail ? (
            <div>
              <dt className="text-xs font-medium text-slate-500">Admissions email</dt>
              <dd>
                <a href={`mailto:${contacts.admissionsEmail}`} className="text-brand-700 hover:underline">
                  {contacts.admissionsEmail}
                </a>
              </dd>
            </div>
          ) : null}
          {websiteHref && (
            <div>
              <dt className="text-xs font-medium text-slate-500">Website</dt>
              <dd>
                <ExternalSiteLink
                  href={websiteHref}
                  variant="inline"
                  institutionName={university.name}
                  institutionId={university.id}
                  linkKind="website"
                  showDomain
                  useInterstitial
                >
                  {university.website}
                </ExternalSiteLink>
              </dd>
            </div>
          )}
        </dl>
        {socialEntries.length ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-brand-100 pt-4">
            {socialEntries.map(([key, href]) => (
              <ExternalSiteLink
                key={key}
                href={safeExternalUrl(href)}
                variant="secondary"
                institutionName={university.name}
                institutionId={university.id}
                linkKind="other"
                useInterstitial
              >
                {socialLabel(key)}
              </ExternalSiteLink>
            ))}
          </div>
        ) : null}
      </header>

      <InstitutionCampaignBanner
        institutionId={university.id}
        institutionName={university.name}
        showProfileLink={false}
      />

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-brand-900">Applications & intake</h2>
          <div className="flex flex-wrap gap-2">
            <OpenStatePill label="Applications" value={admissions.applicationsStatus} />
            <OpenStatePill label="Registration" value={admissions.registrationStatus} />
          </div>
        </div>
        <div className="mt-3">
          <UniversityApplicationBlock university={university} compact={false} profileLink={false} />
        </div>
        {admissions.registrationOpen || admissions.registrationClose ? (
          <dl className="mt-4 grid gap-3 border-t border-brand-100 pt-4 text-sm text-slate-700 sm:grid-cols-2">
            {admissions.registrationOpen ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Registration opens</dt>
                <dd className="mt-1 font-medium text-brand-900">{formatLongDate(admissions.registrationOpen)}</dd>
              </div>
            ) : null}
            {admissions.registrationClose ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Registration closes</dt>
                <dd className="mt-1 font-medium text-brand-900">{formatLongDate(admissions.registrationClose)}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </section>

      <InternationalApplicantsSection
        university={university}
        marketCountry={university.country || resolveMarketCountry()}
      />

      {isVerified ? (
        <LeadInquiryForm institutionId={university.id} institutionName={university.name} />
      ) : null}

      {(accreditation.status || accreditation.body || accreditation.notes) ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-900">Accreditation</h2>
          <div className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            {accreditation.status ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
                <p className="mt-1 font-medium text-brand-900">{accreditation.status}</p>
              </div>
            ) : null}
            {accreditation.body ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Accrediting body</p>
                <p className="mt-1 font-medium text-brand-900">{accreditation.body}</p>
              </div>
            ) : null}
          </div>
          {accreditation.notes ? <p className="mt-3 text-sm leading-relaxed text-slate-700">{accreditation.notes}</p> : null}
          {accreditation.sourceUrl ? (
            <div className="mt-3">
              <ExternalSiteLink
                href={safeExternalUrl(accreditation.sourceUrl)}
                variant="secondary"
                institutionName={university.name}
                institutionId={university.id}
                linkKind="resource"
                useInterstitial
              >
                View official accreditation source
              </ExternalSiteLink>
            </div>
          ) : null}
        </section>
      ) : null}

      {campusPhotos.length ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-brand-900">Campus photos</h2>
              <p className="mt-1 text-sm text-slate-600">A quick visual feel for the institution environment.</p>
            </div>
            <p className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
              {campusPhotos.length} {campusPhotos.length === 1 ? "photo" : "photos"}
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {campusPhotos.slice(0, 6).map((photo, index) => (
              <div key={`${photo}-${index}`} className="overflow-hidden rounded-2xl border border-brand-100 bg-brand-50/40">
                <img
                  src={resolveProgrammeThemeUrl(photo)}
                  alt={`${university.name} campus ${index + 1}`}
                  className="h-52 w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {(studentLife.accommodationStatus ||
        studentLife.accommodationDetails ||
        studentLife.facilities.length ||
        studentLife.sports.length ||
        studentLife.careerSupport ||
        studentLife.campusSecurity) ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-900">Student life, support, and career outcomes</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <StudentLifeCard title="Accommodation" body={studentLife.accommodationDetails} kicker={studentLife.accommodationStatus} />
            <StudentLifeCard title="Career support and jobs" kicker={availabilityKicker(studentLife.careerSupport)} />
            <StudentLifeCard title="On-campus security" kicker={availabilityKicker(studentLife.campusSecurity)} />
          </div>
          <CampusTagList title="On campus" items={studentLife.facilities} meta={facilityMeta} />
          <CampusTagList title="Sports offered" items={studentLife.sports} meta={sportMeta} />
        </section>
      ) : null}

      <UniversityStudentIncentives university={university} />

      <UniversityFacultyFeesSection university={university} />

      {Array.isArray(university.staff) && university.staff.length > 0 ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-900">Admissions & staff contacts</h2>
          <p className="mt-1 text-sm text-slate-600">
            Published by the institution for student enquiries. Confirm details on the official site before you contact
            anyone.
          </p>
          <ul className="mt-4 divide-y divide-brand-100 rounded-xl border border-brand-100">
            {university.staff
              .filter((person) => person?.name)
              .map((person, index) => (
                <li key={`${person.name}-${person.title || index}`} className="px-3 py-3 text-sm">
                  <p className="font-semibold text-brand-900">{person.name}</p>
                  <p className="text-xs text-slate-600">
                    {[person.title, person.department].filter(Boolean).join(" · ") || "Staff contact"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-800">
                    {person.email ? (
                      <a href={`mailto:${person.email}`} className="underline hover:text-brand-950">
                        {person.email}
                      </a>
                    ) : null}
                    {person.phone ? (
                      <a href={`tel:${String(person.phone).replace(/\s/g, "")}`} className="underline hover:text-brand-950">
                        {person.phone}
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <ProgrammesOfferedSection programmes={programmes} university={university} />

      <UniversityResourcesSection university={university} resources={resources} />

      {faqs.length ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-900">Frequently asked questions</h2>
          <dl className="mt-4 grid gap-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                <dt className="font-semibold text-brand-900">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-700">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <UniversityReviews university={university} />

      <p className="text-xs leading-relaxed text-slate-500">
        Thuto is not affiliated with, endorsed by, or partnered with {university.name}. Institution logos and links are
        for identification and navigation only — confirm all requirements on the official website before you apply.
      </p>
    </article>
  );
}

function ProgrammesOfferedSection({ programmes, university }) {
  const [fieldFilter, setFieldFilter] = useState("All");
  const forUniversity = programmes.filter((p) => programmeBelongsToUniversity(p, university));
  const fields = ["All", ...new Set(forUniversity.map((p) => p.field).filter(Boolean))];
  const filteredProgrammes = fieldFilter === "All" ? forUniversity : forUniversity.filter((p) => p.field === fieldFilter);
  const list = useCollapsibleList(filteredProgrammes, PROGRAMMES_PREVIEW, fieldFilter);

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-brand-900">Programmes offered</h2>
        <p className="text-xs text-slate-500">{forUniversity.length} listed</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Programme field filters">
        {fields.map((field) => (
          <button
            key={field}
            type="button"
            onClick={() => setFieldFilter(field)}
            className={[
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              fieldFilter === field ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100",
            ].join(" ")}
          >
            {field}
          </button>
        ))}
      </div>
      {filteredProgrammes.length ? (
        <>
          <ul id={list.contentId} className="mt-4 divide-y divide-brand-100 rounded-xl border border-brand-100">
            {list.visible.map((programme) => (
              <li key={programme.id} className="flex items-stretch">
                <ProgrammeThemeAccent programme={programme} />
                <Link
                  to={`/programmes/${programme.id}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-3 text-sm transition hover:bg-brand-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-brand-900">{programme.name}</span>
                    <span className="text-xs text-slate-500">
                      {displayFacultyName(university, programme.faculty) || programme.field || "General"}
                      {programme.duration ? ` · ${programme.duration}` : ""}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-brand-700">View →</span>
                </Link>
              </li>
            ))}
          </ul>
          {list.canCollapse ? (
            <ShowMoreButton
              expanded={list.expanded}
              onToggle={list.toggle}
              controls={list.contentId}
              total={list.total}
              noun="programmes"
            />
          ) : null}
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No programmes match this field filter yet.</p>
      )}
    </section>
  );
}

function formatLongDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "");
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function OpenStatePill({ label, value }) {
  if (!value) return null;
  const open = value === "open";
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        open ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-700"
      }`}
    >
      {label}: {openStateLabel(value)}
    </span>
  );
}

function availabilityKicker(value) {
  return value ? availabilityLabel(value) : "";
}

function CampusTagList({ title, items, meta }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => {
          const { label, icon } = meta(item);
          return (
            <span
              key={item}
              className="rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold text-brand-800"
            >
              <span aria-hidden="true">{icon} </span>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function StudentLifeCard({ title, body, kicker, className = "" }) {
  if (!body && !kicker) return null;
  return (
    <div className={["rounded-xl border border-brand-100 bg-brand-50/40 p-4", className].filter(Boolean).join(" ")}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      {kicker ? <p className="mt-1 font-semibold text-brand-900">{kicker}</p> : null}
      {body ? <p className="mt-2 text-sm leading-relaxed text-slate-700">{body}</p> : null}
    </div>
  );
}
