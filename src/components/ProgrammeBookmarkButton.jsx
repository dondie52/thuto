/**
 * @param {{ programmeId: string, programmeName?: string, pressed: boolean, onToggle: () => void }} props
 */
export default function ProgrammeBookmarkButton({ programmeId, programmeName, pressed, onToggle }) {
  const name = programmeName?.trim() || "this programme";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-label={pressed ? `Remove ${name} from saved` : `Save ${name}`}
      aria-pressed={pressed}
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-lg border p-2 transition",
        pressed
          ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
          : "border-brand-200 bg-white text-brand-600 hover:border-brand-300 hover:bg-brand-50",
      ].join(" ")}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        {pressed ? (
          <path
            fill="currentColor"
            d="M17 3H7a2 2 0 00-2 2v16l7-4 7 4V5a2 2 0 00-2-2z"
          />
        ) : (
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
            d="M17 3H7a2 2 0 00-2 2v16l7-4 7 4V5a2 2 0 00-2-2z"
          />
        )}
      </svg>
    </button>
  );
}
