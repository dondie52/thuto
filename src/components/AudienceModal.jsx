import { useEffect } from "react";

/**
 * First-visit popup asking whether the visitor is a student or an
 * institution, so the landing page can show the right story.
 * @param {{ isOpen: boolean, onSelect: (value: string) => void }} props
 */
export default function AudienceModal({ isOpen, onSelect }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audience-modal-title"
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <h2 id="audience-modal-title" className="font-display text-2xl text-stone-900">
          Are you a student or an institution?
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          We'll show you the Thuto experience that fits you best. You can switch anytime from the menu.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onSelect("student")}
            className="focus-ring landing-motion-press rounded-md bg-brand-700 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-md hover:bg-brand-800"
          >
            I'm a Student
          </button>
          <button
            type="button"
            onClick={() => onSelect("institution")}
            className="focus-ring landing-motion-press rounded-md border border-brand-700 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-brand-800 hover:bg-brand-50"
          >
            I'm an Institution
          </button>
        </div>
      </div>
    </div>
  );
}
