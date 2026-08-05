import { useState } from "react";
import { downloadProgrammeSummary, shareProgrammeSummary } from "../lib/programmePdf.js";

/**
 * `compact` renders a single pill that fits the programme header's action row alongside the
 * bookmark and compare controls, instead of the two-button block used elsewhere.
 *
 * @param {{
 *   programme: Record<string, unknown>,
 *   university?: Record<string, unknown> | null,
 *   compact?: boolean,
 * }} props
 */
export default function ProgrammePdfActions({ programme, university = null, compact = false }) {
  const [status, setStatus] = useState("");

  async function handleShare() {
    setStatus("");
    try {
      const shared = await shareProgrammeSummary(programme, { university });
      setStatus(shared ? "Shared via your device." : "Downloaded programme summary.");
    } catch {
      downloadProgrammeSummary(programme, { university });
      setStatus("Downloaded programme summary.");
    }
    window.setTimeout(() => setStatus(""), 3000);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleShare}
        title="Download or share a programme summary"
        className="focus-ring rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-50"
      >
        {status || "Share summary"}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          downloadProgrammeSummary(programme, { university });
          setStatus("Downloaded programme summary.");
          window.setTimeout(() => setStatus(""), 3000);
        }}
        className="focus-ring rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
      >
        Download summary
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="focus-ring rounded-xl bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
      >
        Share summary
      </button>
      {status ? (
        <span className="text-xs text-emerald-800" role="status">
          {status}
        </span>
      ) : null}
    </div>
  );
}
