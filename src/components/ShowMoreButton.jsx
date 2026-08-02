/**
 * Toggle for a list collapsed by `useCollapsibleList`.
 *
 * @param {{
 *   expanded: boolean,
 *   onToggle: () => void,
 *   controls: string,
 *   total: number,
 *   noun: string,
 *   className?: string,
 * }} props
 */
export default function ShowMoreButton({ expanded, onToggle, controls, total, noun, className = "" }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controls}
      className={[
        "focus-ring mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-100 sm:w-auto",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {expanded ? "Show less" : `View all ${total} ${noun}`}
    </button>
  );
}
