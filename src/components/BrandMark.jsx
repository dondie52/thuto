import { Link } from "react-router-dom";

/** Public path to the primary Thuto mark (SVG). Used by the header, splash, and PWA precache. */
export const thutoLogoSrc = `${import.meta.env.BASE_URL}icons/thuto-mark.svg`;

export default function BrandMark({ className = "" }) {
  return (
    <Link
      to="/"
      className={[
        "focus-ring group inline-flex items-center gap-2 rounded-2xl py-1 pr-2 transition-transform duration-300 hover:-translate-y-0.5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Thuto home"
    >
      <img
        src={thutoLogoSrc}
        alt=""
        className="h-10 w-10 shrink-0 rounded-2xl object-contain"
        width="40"
        height="40"
        decoding="async"
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-brand-900">Thuto</span>
        <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500 sm:block">
          BUC
        </span>
      </span>
    </Link>
  );
}
