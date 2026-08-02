import { AboutIcon } from "../ProfileEditForm.jsx";

const MESSAGE_PRIVACY_LABELS = {
  everyone: "Everyone on Thuto",
  followers_only: "People you follow or who follow you",
  connections_only: "Accepted connections only",
};

/**
 * Read-only display of profile About section.
 * Shows Bio, Tagline, and message privacy setting with an Edit button.
 */
export default function ProfileAboutSummary({ profile, onEdit, disabled }) {
  const bio = profile?.bio || profile?.distinction || "";
  const tagline = profile?.distinction || "";
  const messagePrivacy = profile?.message_privacy || "everyone";
  const privacyLabel = MESSAGE_PRIVACY_LABELS[messagePrivacy] || messagePrivacy;

  const hasContent = bio || tagline;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AboutIcon />
          <h3 className="font-display text-lg font-semibold text-brand-900">About</h3>
        </div>
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="focus-ring inline-flex items-center gap-1 rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-700 shadow-sm hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <EditIcon />
          Edit
        </button>
      </div>

      {!hasContent ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50/30 px-3 py-3 text-sm text-stone-600">
          No information yet. Click Edit to add your bio, tagline, and privacy settings.
        </p>
      ) : (
        <>
          {bio ? (
            <div className="rounded-xl border border-brand-100 bg-brand-50/30 px-3 py-3">
              <p className="text-xs font-semibold text-stone-600">Bio</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-700">{bio}</p>
            </div>
          ) : null}

          {tagline ? (
            <div className="rounded-xl border border-brand-100 bg-brand-50/30 px-3 py-3">
              <p className="text-xs font-semibold text-stone-600">Tagline</p>
              <p className="mt-1 text-sm text-stone-700">{tagline}</p>
            </div>
          ) : null}

          <div className="rounded-xl border border-brand-100 bg-brand-50/30 px-3 py-3">
            <p className="text-xs font-semibold text-stone-600">Who can message you</p>
            <p className="mt-1 text-sm text-stone-700">{privacyLabel}</p>
          </div>
        </>
      )}
    </div>
  );
}

function EditIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
