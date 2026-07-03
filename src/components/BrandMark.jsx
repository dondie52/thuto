import { Link } from "react-router-dom";

/** Public path to the primary Thuto mark (SVG). Used by the header and PWA precache. */
export const thutoLogoSrc = `${import.meta.env.BASE_URL}icons/thuto-mark.svg`;

export default function BrandMark({ className = "" }) {
  return (
    <Link
      to="/"
      className={[
        "focus-ring group inline-flex items-center gap-1.5 rounded-lg py-0.5 pr-1.5 transition-transform duration-300 hover:-translate-y-0.5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Thuto home"
    >
      <img
        src={thutoLogoSrc}
        alt=""
        className="h-7 w-7 shrink-0 rounded-lg object-contain"
        width="28"
        height="28"
        decoding="async"
      />
      <span className="font-display text-sm font-semibold leading-none tracking-tight text-brand-900">Thuto</span>
    </Link>
  );
}
