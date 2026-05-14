import { thutoLogoSrc } from "./BrandMark.jsx";

export default function SplashScreen({ exiting = false }) {
  return (
    <div
      className={[
        "fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#effcf9] px-6 text-center transition-opacity duration-500 ease-out",
        exiting ? "pointer-events-none opacity-0" : "opacity-100",
      ].join(" ")}
      role="status"
      aria-label="Loading Thuto"
    >
      <div className="splash-mesh splash-mesh-one" aria-hidden="true" />
      <div className="splash-mesh splash-mesh-two" aria-hidden="true" />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <div className="splash-halo absolute top-10 h-56 w-56 rounded-full bg-brand-300/30 blur-3xl" aria-hidden="true" />
        <img
          src={thutoLogoSrc}
          alt="Thuto"
          className="splash-logo relative h-48 w-48 rounded-[3.25rem] object-contain drop-shadow-[0_28px_55px_rgba(15,118,110,0.28)] sm:h-56 sm:w-56"
          width="224"
          height="224"
        />
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.32em] text-brand-700">Thuto</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">
          Your university companion
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-6 text-stone-600">
          Preparing Botswana programme guidance, eligibility tools, and saved choices.
        </p>
        <div className="mt-8 h-1.5 w-44 overflow-hidden rounded-full bg-brand-100" aria-hidden="true">
          <span className="splash-progress block h-full rounded-full bg-brand-700" />
        </div>
      </div>
    </div>
  );
}
