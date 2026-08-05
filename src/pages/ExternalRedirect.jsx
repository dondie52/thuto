import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { trackOutboundLinkClick } from "../lib/analytics.js";
import { externalHostname, safeExternalUrl } from "../lib/urlSafety.js";
import { recordApplyClick } from "../lib/applications.js";

const LINK_KINDS = new Set(["website", "apply", "resource", "other"]);

export default function ExternalRedirect() {
  useDocumentTitle("Leaving Thuto | Official site");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const href = safeExternalUrl(searchParams.get("to") || "");
  const hostname = externalHostname(href);
  const institutionName = String(location.state?.institutionName || "").trim();
  const documentNotice = Boolean(location.state?.documentNotice);
  const programmeName = String(location.state?.programmeName || "").trim();

  if (!href) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-10 text-sm text-slate-700">
        <h1 className="font-display text-xl font-bold text-brand-900">Link unavailable</h1>
        <p>This external link is missing or invalid.</p>
        <Link to="/app" className="font-semibold text-brand-800 underline hover:text-brand-950">
          Back to Thuto
        </Link>
      </div>
    );
  }

  function handleContinue() {
    const programmeId = searchParams.get("programme") || undefined;
    const institutionId = searchParams.get("institution") || undefined;
    const rawKind = String(searchParams.get("kind") || "").trim().toLowerCase();
    const linkKind = LINK_KINDS.has(rawKind) ? rawKind : institutionId ? "other" : "other";
    trackOutboundLinkClick({
      programmeId,
      institutionId,
      destinationUrl: href,
      linkKind: institutionId ? linkKind : "other",
    });
    if (institutionId && linkKind === "apply") {
      recordApplyClick({
        institutionId,
        institutionName,
        programmeId: programmeId || null,
        programmeName,
        externalUrl: href,
        source: programmeId ? "programme_detail" : "university_detail",
      });
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Leaving Thuto</p>
        <h1 className="mt-2 font-display text-xl font-bold text-brand-900">
          {institutionName ? `Continue to ${institutionName}` : "Continue to official site"}
        </h1>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2 text-sm text-slate-700">
          <span className="text-brand-700" aria-hidden>
            🔒
          </span>
          <span className="min-w-0 break-all font-mono text-xs sm:text-sm">{hostname}</span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Thuto is an independent educational directory and is not affiliated, endorsed, or partnered with any listed
          institution. You will open the official website in your browser where the full address bar is visible.
        </p>

        {documentNotice ? (
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Official documentation is served directly from the institution&apos;s servers. Thuto does not host or modify
            these materials.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex min-h-11 items-center rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Continue to {hostname}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex min-h-11 items-center rounded-full border border-brand-200 bg-white px-5 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            Stay in Thuto
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Tip: use your browser&apos;s menu to open in Chrome or Safari if you prefer a standalone browser window.
        </p>
      </div>

      <Link to="/app" className="inline-block text-sm font-semibold text-brand-800 underline hover:text-brand-950">
        ← Back to Thuto
      </Link>
    </div>
  );
}
