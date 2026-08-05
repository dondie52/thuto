import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ALL_SYLLABUS_VALUES,
  getGradingProfile,
  groupedSyllabi,
  searchSyllabi,
  syllabusCountryName,
} from "../lib/gradingSystems.js";

/**
 * Combobox for picking an exam system, searchable by the abbreviation a student actually types
 * — "wassce", "waec", "matric", "aps", "kcse", "bac".
 *
 * The market country scopes the *default* list, not what can be selected: a Kenyan or Ghanaian
 * student applying to institutions in Botswana is exactly who this exists for.
 *
 * @param {{
 *   value: string,
 *   onChange: (id: string) => void,
 *   country?: string | null,
 *   label?: string,
 *   required?: boolean,
 *   describedBy?: string,
 * }} props
 */
export default function SyllabusPicker({
  value,
  onChange,
  country = "bw",
  label = "Exam system",
  required = false,
  describedBy,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const inputId = useId();
  const listId = `${inputId}-list`;

  const selected = value ? getGradingProfile(value) : null;
  const isKnown = value ? ALL_SYLLABUS_VALUES.includes(value) : false;

  const groups = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return groupedSyllabi(country);
    const results = searchSyllabi(trimmed, { country });
    return results.length ? [{ title: `${results.length} match${results.length === 1 ? "" : "es"}`, profiles: results }] : [];
  }, [query, country]);

  const flat = useMemo(() => groups.flatMap((group) => group.profiles), [groups]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function choose(profile) {
    onChange(profile.id);
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(flat.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter" && open && flat[activeIndex]) {
      event.preventDefault();
      choose(flat[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  let renderIndex = -1;

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-700"> *</span> : null}
      </label>

      {selected && isKnown && !open ? (
        <div className="mt-1 flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2">
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-900">
            {selected.abbreviation}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{selected.label}</span>
          {!selected.verified ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
              Guidance scale
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="focus-ring shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:underline"
          >
            Change
          </button>
        </div>
      ) : (
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-describedby={describedBy}
          value={query}
          placeholder="Search by abbreviation — BGCSE, WASSCE, NSC, KCSE…"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm"
        />
      )}

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-2xl border border-brand-200 bg-white p-1 shadow-lg"
        >
          {!flat.length ? (
            <p className="px-3 py-4 text-sm text-slate-500">
              No exam system matches “{query.trim()}”. Try the abbreviation on your certificate.
            </p>
          ) : null}

          {groups.map((group) => (
            <div key={group.title}>
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {group.title}
              </p>
              <ul>
                {group.profiles.map((profile) => {
                  renderIndex += 1;
                  const index = renderIndex;
                  return (
                    <li key={profile.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={profile.id === value}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => choose(profile)}
                        className={[
                          "flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left",
                          index === activeIndex ? "bg-brand-50" : "hover:bg-brand-50/60",
                        ].join(" ")}
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-brand-900">{profile.abbreviation}</span>
                          {!profile.verified ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                              Guidance scale
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xs text-slate-600">{profile.label}</span>
                        {profile.countries.length ? (
                          <span className="text-[11px] text-slate-500">
                            {profile.countries.slice(0, 4).map(syllabusCountryName).join(" · ")}
                            {profile.countries.length > 4 ? ` +${profile.countries.length - 4} more` : ""}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {!query.trim() ? (
            <p className="border-t border-brand-100 px-3 py-2 text-[11px] text-slate-500">
              Type to search all {ALL_SYLLABUS_VALUES.length} exam systems.
            </p>
          ) : null}
        </div>
      ) : null}

      {selected && isKnown && !open ? (
        <p className="mt-1 text-xs text-slate-500">{selected.helpText}</p>
      ) : null}
    </div>
  );
}
