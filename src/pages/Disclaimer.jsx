import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { usePageContent } from "../hooks/usePageContent.js";
import { PAGE_CONTENT_DEFAULTS } from "../lib/pageContentDefaults.js";

export default function Disclaimer() {
  useDocumentTitle("Disclaimer | Thuto");
  const { content } = usePageContent("disclaimer", PAGE_CONTENT_DEFAULTS.disclaimer);
  const paragraphs = Array.isArray(content.paragraphs) ? content.paragraphs : [];

  return (
    <div className="space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base">
      <h1 className="font-display text-2xl font-bold text-brand-900">{content.heading}</h1>
      {paragraphs.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`}>{paragraph}</p>
      ))}
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
