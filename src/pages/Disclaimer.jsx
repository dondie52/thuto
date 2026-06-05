import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { usePageContent } from "../hooks/usePageContent.js";
import { PAGE_CONTENT_DEFAULTS } from "../lib/pageContentDefaults.js";

export default function Disclaimer() {
  useDocumentTitle("Disclaimer | Thuto");
  const { content } = usePageContent("disclaimer", PAGE_CONTENT_DEFAULTS.disclaimer);
  const paragraphs = Array.isArray(content.paragraphs) ? content.paragraphs : [];
  const contentRemoval = content.contentRemoval || PAGE_CONTENT_DEFAULTS.disclaimer.contentRemoval;
  const removalParagraphs = Array.isArray(contentRemoval?.paragraphs) ? contentRemoval.paragraphs : [];

  return (
    <div className="space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base">
      <h1 className="font-display text-2xl font-bold text-brand-900">{content.heading}</h1>
      {paragraphs.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`}>{paragraph}</p>
      ))}

      <section id="content-removal" className="scroll-mt-24 space-y-3 rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
        <h2 className="font-display text-lg font-semibold text-brand-900">{contentRemoval?.heading}</h2>
        {removalParagraphs.map((paragraph, index) => (
          <p key={`removal-${index}`}>
            {paragraph.includes("legal@thutoapp.com") ? (
              <>
                {paragraph.split("legal@thutoapp.com")[0]}
                <a href="mailto:legal@thutoapp.com" className="font-semibold text-brand-800 underline hover:text-brand-950">
                  legal@thutoapp.com
                </a>
                {paragraph.split("legal@thutoapp.com")[1] || ""}
              </>
            ) : (
              paragraph
            )}
          </p>
        ))}
      </section>

      <p>
        <Link to="/" className="font-semibold text-brand-800 underline hover:text-brand-950">
          Back to home
        </Link>
        {" - "}
        <Link to="/app" className="font-semibold text-brand-800 underline hover:text-brand-950">
          Open app
        </Link>
        {" - "}
        <Link to="/privacy" className="font-semibold text-brand-800 underline hover:text-brand-950">
          Privacy
        </Link>
      </p>
    </div>
  );
}
