const OPTIONS = [
  { value: "student", label: "Students" },
  { value: "institution", label: "Institutions" },
];

/**
 * Compact dropdown letting a landing-page visitor switch between the
 * student and institution stories. Two visual variants: "desktop" (compact
 * pill for the top nav) and "mobile" (full-width, for the mobile menu).
 * @param {{
 *   value: string,
 *   onChange: (value: string) => void,
 *   variant?: 'desktop' | 'mobile',
 *   id?: string,
 * }} props
 */
export default function AudienceSelect({ value, onChange, variant = "desktop", id = "landing-audience" }) {
  const isDesktop = variant === "desktop";

  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="View the landing page as a student or an institution"
      className={
        isDesktop
          ? "focus-ring rounded-md border border-stone-200/80 bg-white/80 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-white"
          : "focus-ring w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-center text-base font-semibold text-stone-800"
      }
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
