import { Link } from "react-router-dom";
import LeadInquiryForm from "./LeadInquiryForm.jsx";
import ExternalSiteLink from "./ExternalSiteLink.jsx";
import { normalizeUniversityContacts } from "../lib/institutionProfile.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

/**
 * Verified partners receive inquiries in their CMS lead inbox. Everyone else used to get
 * nothing at all, so the section is always rendered and falls back to the institution's own
 * published admissions contacts plus the in-app assistant — never a dead end.
 *
 * @param {{
 *   university: Record<string, any> | null,
 *   programmeId?: string,
 *   programmeName?: string,
 *   isVerifiedPartner?: boolean,
 * }} props
 */
export default function RequestInformationSection({
  university,
  programmeId,
  programmeName = "",
  isVerifiedPartner = false,
}) {
  const institutionName = university?.name || "this institution";

  if (isVerifiedPartner && university?.id) {
    return (
      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-900">Request information</h2>
        <p className="mt-1 text-sm text-slate-600">
          {institutionName} answers admissions questions through Thuto. Send them a message and they will reply to
          you directly.
        </p>
        <div className="mt-4">
          <LeadInquiryForm
            institutionId={university.id}
            programmeId={programmeId}
            institutionName={institutionName}
          />
        </div>
      </section>
    );
  }

  const contacts = normalizeUniversityContacts(university);
  const admissionsEmail = contacts.admissionsEmail || contacts.generalEmail;
  const admissionsPhone = contacts.admissionsPhone || contacts.generalPhone;
  const websiteHref = safeExternalUrl(university?.website);
  const hasContacts = Boolean(admissionsEmail || admissionsPhone || websiteHref);
  const assistantQuestion = programmeName
    ? `Tell me about ${programmeName} at ${institutionName}`
    : `Tell me about admissions at ${institutionName}`;

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-brand-900">Request information</h2>
      <p className="mt-1 text-sm text-slate-600">
        {institutionName} does not take admissions questions through Thuto yet.{" "}
        {hasContacts
          ? "Reach their admissions office directly, or ask Thuto first."
          : "Thuto has no admissions contact on file for them — ask Thuto, or check their official website."}
      </p>

      {hasContacts ? (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {admissionsEmail ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Admissions email</dt>
              <dd>
                <a href={`mailto:${admissionsEmail}`} className="font-medium text-brand-700 hover:underline">
                  {admissionsEmail}
                </a>
              </dd>
            </div>
          ) : null}
          {admissionsPhone ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Admissions phone</dt>
              <dd>
                <a
                  href={`tel:${String(admissionsPhone).replace(/\s/g, "")}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {admissionsPhone}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          to={`/assistant?q=${encodeURIComponent(assistantQuestion)}`}
          className="focus-ring rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Ask Thuto
        </Link>
        {websiteHref ? (
          <ExternalSiteLink
            href={websiteHref}
            variant="secondary"
            institutionName={institutionName}
            institutionId={university?.id}
            linkKind="website"
            useInterstitial
          >
            Visit website
          </ExternalSiteLink>
        ) : null}
      </div>
    </section>
  );
}
