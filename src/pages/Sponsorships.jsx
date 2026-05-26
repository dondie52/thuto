import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const DTEF_PORTAL = "https://tef.gov.bw";
const assetBase = import.meta.env.BASE_URL;

function IconGovBuilding({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M6 21V10l6-4 6 4v11M9 21v-4h6v4M10 14h1M13 14h1M10 10h1M13 10h1" />
    </svg>
  );
}

function IconCampus({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.33-3.516M12 14l-6.33-3.516M12 14v7" />
    </svg>
  );
}

function IconBriefcase({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M4 7h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v4M9 12h6" />
    </svg>
  );
}

function IconPhone({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.44 12.44 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.44 12.44 0 002.81.7A2 2 0 0122 16.92z"
      />
    </svg>
  );
}

function IconExternal({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7M10 14L21 3M21 14v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6" />
    </svg>
  );
}

const fundingRoutes = [
  {
    title: "Government sponsorship",
    body: "Public windows and required documents for national sponsorship schemes, including the DTEF online portal for new students.",
    Icon: IconGovBuilding,
  },
  {
    title: "Institution scholarships",
    body: "Keep an eye on university-funded awards, merit support, and programme-specific funding notices.",
    Icon: IconCampus,
  },
  {
    title: "Private and employer support",
    body: "Plan for bursaries, workplace support, and sector-linked funding where a programme connects to a sponsor.",
    Icon: IconBriefcase,
  },
];

const dtefContacts = [
  { label: "Enquiries", detail: "Weekdays 07:30–16:30", tel: null },
  { label: "Toll-free", detail: "0800 600 185", tel: "tel:+267800600185" },
  { label: "Call centre", detail: "371 9364 / 371 9439 / 371 9441 / 371 9473", tel: "tel:+2673719364" },
  { label: "PR office", detail: "371 9319", tel: "tel:+2673719319" },
  { label: "Switchboard", detail: "371 9300 / 371 9301", tel: "tel:+2673719300" },
];

const dtefApplicationSteps = [
  {
    title: "Online log-in and sign up",
    body: `Visit the Online Tertiary Education Sponsorship portal (${DTEF_PORTAL}), choose Sign Up (top right), complete your details, enter a valid email, then select Create New Account. DTEF should email you to confirm the account was created.`,
  },
  {
    title: "Verify your email",
    body: "Open the DTEF message in your inbox, follow the instructions, create your password, then sign in with that password.",
  },
  {
    title: "Apply",
    body: "After logging in, select Apply for Sponsorship.",
  },
  {
    title: "Choose the application type",
    body: "Under Applications and beneficiary, open the New student sub-tab.",
  },
  {
    title: "Complete the form and attach documents",
    body: "Enter all relevant details, choose the correct category of sponsorship, and upload supporting documents as PDF, JPEG, PNG, or JPG. Use Next and Previous to move between pages. Save Draft to pause before the deadline; Reset clears unsubmitted work, including drafts. If you are below the minimum cut-off points, the system stops you from continuing and emails you.",
  },
  {
    title: "Sign the declaration",
    body: "Tick the Student Declaration box to accept the application requirements. If a programme has hit its sponsorship limit, choose Add revise programme for an alternative.",
  },
  {
    title: "Review the application",
    body: "Select Review and read everything carefully before final submission.",
  },
  {
    title: "Submit",
    body: "Choose Submit so your application can be assessed.",
  },
  {
    title: "Confirmation of submission",
    body: "Expect a confirmation or acknowledgement message in the email you registered.",
  },
  {
    title: "View and print",
    body: "You can open the submitted application form and acknowledgement to print copies for your records.",
  },
  {
    title: "Check application status",
    body: "Sign in, choose Submissions, and review the status of each submitted application whenever you need an update.",
  },
  {
    title: "Accept the sponsorship agreement",
    body: "If you qualify and receive an offer, accept it to read the DTEF sponsorship agreement. Agreeing to the terms should release your sponsorship letter by email so you can print it and register at your institution.",
  },
];

export default function Sponsorships() {
  useDocumentTitle("Sponsorships | Thuto");

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-white via-brand-50/50 to-brand-100/30 p-5 shadow-sm sm:p-6">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-300/25 blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Sponsorships</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-brand-900">Funding routes</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
              A first home for sponsorship notes, deadlines, and funding paths linked to Botswana study options. Thuto
              does not submit applications to funders—use the official portals and call centres below.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-brand-100 bg-white/90 px-4 py-3 shadow-sm ring-1 ring-brand-900/5">
            <img
              src={`${assetBase}icons/tef-portal-mark.svg`}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 shrink-0"
            />
            <div className="min-w-0 text-xs leading-snug text-slate-600">
              <p className="font-semibold text-brand-900">Online Tertiary Education Sponsorship</p>
              <p className="mt-1">Illustrative mark only—not an official Government of Botswana crest.</p>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {fundingRoutes.map(({ title, body, Icon }) => (
          <article
            key={title}
            className="flex flex-col rounded-2xl border border-brand-100 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-800 ring-1 ring-brand-100">
              <Icon className="h-6 w-6" />
            </span>
            <h2 className="mt-3 font-display text-lg font-semibold text-brand-900">{title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{body}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm">
        <div className="border-b border-brand-100 bg-gradient-to-r from-brand-800 to-[#0d4a45] px-4 py-4 text-white sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-200">Botswana · DTEF</p>
          <h2 className="mt-1 font-display text-xl font-semibold leading-snug sm:text-2xl">
            Tertiary education government sponsorship
          </h2>
          <p className="mt-1 text-sm text-brand-100/95">2025/2026 intake · New students · Public application summary</p>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <p className="text-sm leading-relaxed text-slate-600">
            The steps below summarise the public application process published for the Online Tertiary Education
            Sponsorship portal. Always confirm deadlines, wording, and requirements on the official site or with DTEF
            before you act.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href={DTEF_PORTAL}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
            >
              Open official portal
              <IconExternal className="h-4 w-4 opacity-90" />
            </a>
            <span className="text-xs text-slate-500 sm:ml-1">{DTEF_PORTAL}</span>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-stone-800">
            <p className="font-semibold text-stone-900">Website security</p>
            <p className="mt-1 leading-relaxed">
              Browsers may warn you if the portal certificate is expired or invalid. If you see a security warning, avoid
              entering passwords until the site is fixed or use the contact numbers below to confirm how DTEF wants
              applicants to proceed.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-brand-900">For enquiries</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {dtefContacts.map((row) => (
                <li
                  key={row.label}
                  className="flex items-start gap-3 rounded-xl border border-stone-200/80 bg-stone-50/80 px-3 py-3"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm ring-1 ring-stone-200/80">
                    <IconPhone />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-slate-900">{row.label}</p>
                    {row.tel ? (
                      <a href={row.tel} className="mt-0.5 block text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950">
                        {row.detail}
                      </a>
                    ) : (
                      <p className="mt-0.5 text-slate-600">{row.detail}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Call-centre row dials the first listed number on tap-to-call devices; use the other extensions from a
              landline or full national number if needed.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-brand-900">Application steps</h3>
            <ol className="mt-3 space-y-0 divide-y divide-stone-200/90 rounded-xl border border-stone-200/90 bg-stone-50/50">
              {dtefApplicationSteps.map((step, index) => (
                <li key={step.title} className="flex gap-3 px-3 py-3.5 sm:gap-4 sm:px-4">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white shadow-sm"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 text-sm leading-relaxed text-slate-700">
                    <span className="font-semibold text-slate-900">{step.title}. </span>
                    {step.body}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-stone-900">Verify before you rely on this page</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-700">
          Sponsorship rules change. Cross-check every detail with official DTEF notices, the live portal, or the call
          centre numbers above.
        </p>
        <Link to="/universities" className="mt-3 inline-flex text-sm font-semibold text-brand-800 underline">
          Check university profiles
        </Link>
      </div>
    </div>
  );
}
