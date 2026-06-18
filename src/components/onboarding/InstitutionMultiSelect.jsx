import { useMemo, useState } from "react";
import { categorizeUniversity, UNIVERSITY_CATEGORY_META, UNIVERSITY_CATEGORY_ORDER } from "../../lib/universitiesData.js";

/**
 * @param {{
 *   universities: Array<{ id: string, name: string, location?: string, category?: string }>,
 *   selectedIds: string[],
 *   onChange: (ids: string[]) => void,
 *   max?: number,
 *   disabled?: boolean,
 * }} props
 */
export default function InstitutionMultiSelect({
  universities,
  selectedIds,
  onChange,
  max = 10,
  disabled = false,
}) {
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter(
      (uni) => uni.name.toLowerCase().includes(q) || String(uni.location || "").toLowerCase().includes(q),
    );
  }, [universities, query]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const category of UNIVERSITY_CATEGORY_ORDER) map.set(category, []);
    for (const uni of filtered) {
      const category = categorizeUniversity(uni);
      if (!map.has(category)) continue;
      map.get(category).push(uni);
    }
    return map;
  }, [filtered]);

  function toggle(id) {
    if (disabled) return;
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((value) => value !== id));
      return;
    }
    if (selectedIds.length >= max) return;
    onChange([...selectedIds, id]);
  }

  const selectedUniversities = universities.filter((uni) => selectedSet.has(uni.id));

  return (
    <div className="space-y-3">
      {selectedUniversities.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedUniversities.map((uni) => (
            <button
              key={uni.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(uni.id)}
              className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {uni.name}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-stone-500">No institutions selected yet.</p>
      )}

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        disabled={disabled}
        placeholder="Search institutions..."
        className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-60"
      />

      <div className="max-h-56 space-y-3 overflow-y-auto rounded-xl border border-brand-100 bg-brand-50/40 p-3">
        {UNIVERSITY_CATEGORY_ORDER.map((category) => {
          const list = grouped.get(category) || [];
          if (!list.length) return null;
          const meta = UNIVERSITY_CATEGORY_META[category];
          return (
            <div key={category}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">{meta?.label}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {list.map((uni) => {
                  const active = selectedSet.has(uni.id);
                  const atMax = !active && selectedIds.length >= max;
                  return (
                    <li key={uni.id}>
                      <button
                        type="button"
                        disabled={disabled || atMax}
                        onClick={() => toggle(uni.id)}
                        className={[
                          "rounded-full border px-3 py-1 text-xs font-medium transition",
                          active
                            ? "border-brand-700 bg-brand-700 text-white"
                            : "border-brand-200 bg-white text-brand-900 hover:border-brand-400",
                          atMax && "opacity-50",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {uni.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-stone-500">Select up to {max} institutions to seed your feed.</p>
    </div>
  );
}
