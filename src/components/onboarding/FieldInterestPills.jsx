import { CAREER_AREA_OPTIONS } from "../../lib/fitFinder.js";

const OPTIONS = CAREER_AREA_OPTIONS.filter((option) => option.value);

/**
 * @param {{
 *   selected: string[],
 *   onChange: (values: string[]) => void,
 *   disabled?: boolean,
 *   options?: { value: string, label: string }[],
 *   ariaLabel?: string,
 * }} props
 */
export default function FieldInterestPills({
  selected,
  onChange,
  disabled = false,
  options = OPTIONS,
  ariaLabel,
}) {
  const selectedSet = new Set(selected);

  function toggle(value) {
    if (disabled) return;
    if (selectedSet.has(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }
    onChange([...selected, value]);
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = selectedSet.has(option.value);
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => toggle(option.value)}
            className={[
              "focus-ring rounded-full border px-3 py-1.5 text-xs font-medium transition",
              active
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-brand-200 bg-white text-brand-900 hover:border-brand-400",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
