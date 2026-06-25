import { Link } from "react-router-dom";

/**
 * @param {{ feature?: string, className?: string }} props
 */
export default function UpgradePrompt({ feature = "this feature", className = "" }) {
  return (
    <div
      className={[
        "rounded-xl border border-brand-200 bg-brand-50/80 px-4 py-3 text-sm text-brand-900",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="font-medium">Upgrade to Thuto Pro to unlock {feature}.</p>
      <Link
        to="/upgrade"
        className="mt-2 inline-flex rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800"
      >
        View Pro plans
      </Link>
    </div>
  );
}
