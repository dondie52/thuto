import { Link } from "react-router-dom";

const FEATURE_LABELS = {
  acceptanceChance: "acceptance chance estimates",
  gradeImport: "certificate photo & PDF import",
  documentsChecklist: "application documents checklist",
  pdfDownload: "programme PDF downloads",
  deadlineAlerts: "deadline & sponsorship alerts",
  assistantDailyLimit: "unlimited AI questions",
  maxSavedProgrammes: "unlimited saved programmes",
  compareMax: "more programme comparisons",
  messageAnyone: "messaging anyone on Thuto",
};

/**
 * @param {{ feature?: keyof typeof FEATURE_LABELS, message?: string, compact?: boolean }} props
 */
export default function UpgradePrompt({ feature, message, compact = false }) {
  const label = feature ? FEATURE_LABELS[feature] : null;
  const body =
    message ||
    (label ? `Upgrade to Thuto Pro to unlock ${label}.` : "Upgrade to Thuto Pro to unlock this feature.");

  if (compact) {
    return (
      <p className="text-xs text-slate-600">
        {body}{" "}
        <Link to="/upgrade" className="font-semibold text-brand-700 underline">
          View plans
        </Link>
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3">
      <p className="text-sm text-brand-900">{body}</p>
      <Link
        to="/upgrade"
        className="focus-ring mt-2 inline-flex rounded-xl bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
      >
        Upgrade to Pro — from P59/year
      </Link>
    </div>
  );
}
