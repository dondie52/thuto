import { useId, useState } from "react";
import ShowMoreButton from "./ShowMoreButton.jsx";
import {
  formatModuleSemesterLabel,
  getProgrammeModuleBlocks,
  getProgrammeModulePreview,
  isResearchDegreeProgramme,
} from "../lib/programmeModules.js";

// Full curricula run to 40+ modules across eight semesters, which buries every section below
// them. Only the first block (typically semester 1) is shown until the student asks for the rest.
const FALLBACK_PREVIEW = 10;

/**
 * @param {{ programme: Record<string, unknown> }} props
 */
export default function ProgrammeModulesSection({ programme }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const blocks = getProgrammeModuleBlocks(programme);
  const total = blocks.reduce((sum, block) => sum + block.modules.length, 0);
  // A single unlabelled block means the source had a flat module list with no semester grouping,
  // so fall back to a count-based preview rather than showing all of it.
  const grouped = blocks.length > 1;
  const canCollapse = grouped || total > FALLBACK_PREVIEW;
  const previewBlocks = grouped ? blocks.slice(0, 1) : getProgrammeModulePreview(blocks, FALLBACK_PREVIEW);
  const visibleBlocks = canCollapse && !expanded ? previewBlocks : blocks;
  const research = isResearchDegreeProgramme(programme);
  const isPostgraduate =
    String(programme?.qualification || "").toLowerCase() === "postgraduate" ||
    /master|mphil|phd|mba|llm|mmed|post.?grad|pgd|pgde/i.test(String(programme?.name || ""));

  if (!blocks.length) {
    return (
      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-900">Modules &amp; courses</h2>
        <p className="mt-2 text-sm text-slate-600">
          {research
            ? "This is a research degree. Module lists are not published like taught undergraduate programmes — confirm supervision requirements and graduate school training with the institution."
            : isPostgraduate
              ? "Postgraduate module lists are not listed in Thuto yet. Check the official programme page or graduate school handbook."
              : "Module and course lists are not listed in Thuto yet. Check the institution prospectus or faculty handbook."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-brand-900">
          {research ? "Research phases" : "Modules & courses"}
        </h2>
        <p className="text-xs text-slate-500">
          {total} {research ? "phase" : "module"}
          {total === 1 ? "" : "s"} listed
        </p>
      </div>
      {research ? (
        <p className="mt-2 text-sm text-slate-600">
          PhD and MPhil programmes are research-based. The phases below describe the typical progression — not a fixed
          semester timetable.
        </p>
      ) : programme.profileCompleteness === "partial" ? (
        <p className="mt-2 text-sm text-amber-900/80">
          Module list may be incomplete. Confirm the latest curriculum on the institution&apos;s official page.
        </p>
      ) : null}
      <div id={listId} className="mt-4 space-y-4">
        {visibleBlocks.map((block, index) => (
          <div key={`${block.semester}-${index}`} className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
            <h3 className="text-sm font-semibold text-brand-900">{formatModuleSemesterLabel(block.semester)}</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {block.modules.map((moduleName) => (
                <li key={moduleName} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                  <span>{moduleName}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {canCollapse ? (
        <ShowMoreButton
          expanded={expanded}
          onToggle={() => setExpanded((value) => !value)}
          controls={listId}
          total={total}
          noun={research ? "phases" : "modules"}
        />
      ) : null}
    </section>
  );
}
