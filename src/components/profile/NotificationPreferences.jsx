import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useEntitlements } from "../../hooks/useEntitlements.js";
import UpgradePrompt from "../UpgradePrompt.jsx";
import {
  getNotificationPreferences,
  NOTIFICATION_PREFERENCE_OPTIONS,
  saveNotificationPreferences,
} from "../../lib/notificationPreferences.js";

export default function NotificationPreferences() {
  const { entitlements } = useEntitlements();
  const [prefs, setPrefs] = useState(() => getNotificationPreferences());
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setPrefs(getNotificationPreferences());
  }, []);

  function handleToggle(key) {
    if ((key === "deadlineReminders" || key === "sponsorshipAlerts") && !entitlements.deadlineAlerts) {
      return;
    }
    const next = saveNotificationPreferences({ [key]: !prefs[key] });
    setPrefs(next);
    setNotice("Notification preferences saved.");
    window.setTimeout(() => setNotice(""), 2500);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Choose which in-app alerts you want to see. These apply to notifications in your feed inbox.
      </p>
      <ul className="space-y-2">
        {NOTIFICATION_PREFERENCE_OPTIONS.map((option) => {
          const proOnly =
            (option.key === "deadlineReminders" || option.key === "sponsorshipAlerts") &&
            !entitlements.deadlineAlerts;
          return (
            <li
              key={option.key}
              className="flex items-start justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-900">
                  {option.label}
                  {proOnly ? <span className="ml-2 text-xs font-semibold text-brand-600">Pro</span> : null}
                </p>
                <p className="mt-0.5 text-xs text-stone-600">{option.description}</p>
                {proOnly ? (
                  <p className="mt-1 text-xs text-slate-500">Free accounts see dates in the app only.</p>
                ) : null}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[option.key]}
                disabled={proOnly}
                onClick={() => handleToggle(option.key)}
                className={`focus-ring relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
                  prefs[option.key] ? "bg-brand-700" : "bg-stone-300"
                } ${proOnly ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    prefs[option.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
                <span className="sr-only">{prefs[option.key] ? "On" : "Off"}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {entitlements.deadlineAlerts ? (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Pro alerts can also reach you on WhatsApp, SMS, and push when those channels are connected to your account.
        </p>
      ) : (
        <UpgradePrompt
          feature="deadlineAlerts"
          message="WhatsApp, SMS, and push deadline & sponsorship alerts are included with Thuto Pro."
        />
      )}

      <Link
        to="/feed/notifications"
        className="focus-ring inline-flex rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
      >
        View notification inbox
      </Link>
      {notice ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
