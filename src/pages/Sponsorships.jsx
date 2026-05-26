import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const DTEF_PORTAL = "https://tef.gov.bw";

const fundingRoutes = [
  {
    title: "Government sponsorship",
    body: "Public windows and required documents for national sponsorship schemes, including the DTEF online portal for new students.",
  },
  {
    title: "Institution scholarships",
    body: "Keep an eye on university-funded awards, merit support, and programme-specific funding notices.",
  },
  {
    title: "Private and employer support",
    body: "Plan for bursaries, workplace support, and sector-linked funding where a programme connects to a sponsor.",
  },
];

const dtefContacts = [
  { label: "Enquiries", detail: "Weekdays 07:30–16:30" },
  { label: "Toll-free", detail: "0800 600 185" },
  { label: "Call centre", detail: "371 9364 / 371 9439 / 371 9441 / 371 9473" },
  { label: "PR office", detail: "371 9319" },
  { label: "Switchboard", detail: "371 9300 / 371 9301" },
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
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Sponsorships</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-900">Funding routes</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          A first home for sponsorship notes, deadlines, and funding paths linked to Botswana study options.
        </p>
      </div>

      <section className="space-y-3">
        {fundingRoutes.map((route) => (
          <article key={route.title} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-brand-900">{route.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{route.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Botswana · DTEF</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-brand-900">
          Tertiary education government sponsorship (2025/2026 intake, new students)
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The steps below summarise the public application process published for the Online Tertiary Education Sponsorship portal. Always confirm deadlines, wording, and requirements on the official site or with DTEF before you act.
        </p>

        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-stone-800">
          <p className="font-semibold text-stone-900">Website security</p>
          <p className="mt-1 leading-relaxed">
            Browsers may warn you if the portal certificate is expired or invalid. If you see a security warning, avoid entering passwords until the site is fixed or use the contact numbers below to confirm how DTEF wants applicants to proceed.
          </p>
        </div>

        <p className="mt-4 text-sm font-semibold text-brand-900">Official portal</p>
        <a
          href={DTEF_PORTAL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex text-sm font-semibold text-brand-800 underline"
        >
          {DTEF_PORTAL}
        </a>

        <div className="mt-4">
          <p className="text-sm font-semibold text-brand-900">For enquiries</p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            {dtefContacts.map((row) => (
              <li key={row.label}>
                <span className="font-semibold text-slate-800">{row.label}:</span> {row.detail}
              </li>
            ))}
          </ul>
        </div>

        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-700 marker:font-semibold marker:text-brand-800">
          {dtefApplicationSteps.map((step) => (
            <li key={step.title}>
              <span className="font-semibold text-slate-900">{step.title}. </span>
              {step.body}
            </li>
          ))}
        </ol>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-stone-900">Verify before you rely on this page</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-700">
          Sponsorship rules change. Cross-check every detail with official DTEF notices, the live portal, or the call centre numbers above.
        </p>
        <Link to="/universities" className="mt-3 inline-flex text-sm font-semibold text-brand-800 underline">
          Check university profiles
        </Link>
      </div>
    </div>
  );
}
