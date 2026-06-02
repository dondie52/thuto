import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { usePageContent } from "../hooks/usePageContent.js";
import { PAGE_CONTENT_DEFAULTS } from "../lib/pageContentDefaults.js";

export default function Privacy() {
  useDocumentTitle("Privacy | Thuto");
  const { content } = usePageContent("privacy", PAGE_CONTENT_DEFAULTS.privacy);
  const sections = Array.isArray(content.sections) ? content.sections : [];

  return (
    <div className="space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base">
      <h1 className="font-display text-2xl font-bold text-brand-900">{content.heading}</h1>
      <p>{content.intro}</p>

      {sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-brand-900">{section.heading}</h2>
          {(section.paragraphs || []).map((paragraph, index) => (
            <p key={`${section.heading}-${index}`}>{paragraph}</p>
          ))}
        </section>
      ))}

      <p className="text-sm text-slate-600">
        <Link to="/disclaimer" className="font-semibold text-brand-800 underline hover:text-brand-950">
          Disclaimer
        </Link>
        {" - "}
        <Link to="/app" className="font-semibold text-brand-800 underline hover:text-brand-950">
          Open app
        </Link>
      </p>
    </div>
  );
}
