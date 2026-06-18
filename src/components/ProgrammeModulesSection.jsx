import {
  countProgrammeModules,
  formatModuleSemesterLabel,
  getProgrammeModuleBlocks,
  isResearchDegreeProgramme,
  programmeHasModules,
} from "../lib/programmeModules.js";

/**
 * @param {{ programme: Record<string, unknown> }} props
 */
export default function ProgrammeModulesSection({ programme }) {
  const blocks = getProgrammeModuleBlocks(programme);
  const total = countProgrammeModules(programme);
  const research = isResearchDegreeProgramme(programme);
  const isPostgraduate =
    String(programme?.qualification || "").toLowerCase() === "postgraduate" ||
    /master|mphil|phd|mba|llm|mmed|post.?grad|pgd|pgde/i.test(String(programme?.name || ""));

  if (!programmeHasModules(programme)) {
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
      <div className="mt-4 space-y-4">
        {blocks.map((block, index) => (
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
    </section>
  );
}
