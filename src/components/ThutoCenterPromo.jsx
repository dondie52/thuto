import { Link } from "react-router-dom";

/**
 * @param {{ compact?: boolean, className?: string }} props
 */
export default function ThutoCenterPromo({ compact = false, className = "" }) {
  if (compact) {
    return (
      <div className={["rounded-2xl border border-brand-200 bg-brand-50/70 px-4 py-3", className].join(" ")}>
        <p className="text-sm font-semibold text-brand-900">Thuto Center — campus study library</p>
        <p className="mt-1 text-xs text-stone-600">Notes, past papers, and exam prep shared by Botswana students.</p>
        <Link
          to="/center"
          className="focus-ring mt-2 inline-flex min-h-10 items-center rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800"
        >
          Open Thuto Center
        </Link>
      </div>
    );
  }

  return (
    <section
      className={[
        "overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-800 to-[#1a4d48] p-5 text-white shadow-sm",
        className,
      ].join(" ")}
      aria-labelledby="thuto-center-promo-heading"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-200">New · Campus library</p>
      <h2 id="thuto-center-promo-heading" className="mt-1 font-display text-xl font-semibold">
        Thuto Center
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-brand-100">
        Upload your notes and officially released past papers, or unlock study materials from other students. Pro members
        get instant downloads.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/center"
          className="focus-ring inline-flex min-h-11 items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brand-50"
        >
          Open Thuto Center
        </Link>
        <Link
          to="/center/upload"
          className="focus-ring inline-flex min-h-11 items-center rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
        >
          Upload material
        </Link>
      </div>
    </section>
  );
}
