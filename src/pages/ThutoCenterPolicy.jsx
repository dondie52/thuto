import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { CENTER_POLICY } from "../lib/thutoCenter.js";

export default function ThutoCenterPolicy() {
  useDocumentTitle("Thuto Center policy | Thuto");

  return (
    <div className="space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base">
      <div>
        <Link to="/center" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Thuto Center
        </Link>
      </div>

      <header className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-brand-900">{CENTER_POLICY.heading}</h1>
        <p className="text-sm text-stone-500">
          Version {CENTER_POLICY.version} · Effective {CENTER_POLICY.effectiveDate}
        </p>
        <p>{CENTER_POLICY.intro}</p>
      </header>

      {CENTER_POLICY.sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-brand-900">{section.heading}</h2>
          {(section.paragraphs || []).map((paragraph, index) => (
            <p key={`${section.heading}-p-${index}`}>{paragraph}</p>
          ))}
          {section.bullets?.length ? (
            <ul className="list-disc space-y-1 pl-5">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <section className="rounded-2xl border border-brand-100 bg-brand-50/40 p-5 space-y-3">
        <h2 className="font-display text-lg font-semibold text-brand-900">Uploader declaration</h2>
        <p>{CENTER_POLICY.declaration}</p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-2">
        <h2 className="font-display text-lg font-semibold text-brand-900">Contact & takedowns</h2>
        <p>
          Rights holders, lecturers, and institutions may request removal or correction by emailing{" "}
          <a href={`mailto:${CENTER_POLICY.contactEmail}`} className="font-semibold text-brand-800 underline">
            {CENTER_POLICY.contactEmail}
          </a>
          . Include the document title, course code, and the reason for your request.
        </p>
        <p>
          See also the{" "}
          <Link to="/disclaimer#content-removal" className="font-semibold text-brand-800 underline">
            general IP & content removal
          </Link>{" "}
          section and{" "}
          <Link to="/privacy" className="font-semibold text-brand-800 underline">
            Privacy
          </Link>{" "}
          page.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/center/upload"
          className="focus-ring inline-flex min-h-11 items-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Upload material
        </Link>
        <Link
          to="/upgrade"
          className="focus-ring inline-flex min-h-11 items-center rounded-full border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-800"
        >
          Thuto Pro — instant access
        </Link>
      </div>
    </div>
  );
}
