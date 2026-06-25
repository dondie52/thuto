import { useState } from "react";
import { downloadProgrammeSummary, shareProgrammeSummary } from "../lib/programmePdf.js";

/**
 * @param {{ programme: Record<string, unknown>, university?: Record<string, unknown> | null }} props
 */
export default function ProgrammePdfActions({ programme, university = null }) {
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
