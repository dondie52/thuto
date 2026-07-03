import { useRef } from "react";
import UserDisplayName from "../UserDisplayName.jsx";
import { useProfileAvatarUpload } from "../../hooks/useProfileAvatarUpload.js";
import { formatAuthorUniversity } from "../../lib/profile.js";

function profileInitial(name) {
  const letter = String(name || "S")
    .trim()
    .charAt(0)
    .toUpperCase();
  return letter || "S";
}

function EditIcon({ className = "size-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CameraIcon({ className = "size-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

/**
 * @param {{
 *   user: object,
 *   profile: object,
 *   isPremium: boolean,
 *   onSave: (patch: object) => Promise<object>,
 *   onEdit?: () => void,
 *   disabled?: boolean,
 * }} props
 */
export default function ProfileHero({ user, profile, isPremium, onSave, onEdit, disabled = false }) {
  const fileInputRef = useRef(null);
  const displayName = profile.full_name || user.email || "Student";
  const universityLine = formatAuthorUniversity({
    universityName: profile.university_name,
    universityStatus: profile.university_status,
  });

  const { avatarUrl, isUploading, upload } = useProfileAvatarUpload({
    avatarUrl: profile.avatar_url,
    onSave,
  });

  async function handleAvatarPick(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || disabled) return;
    try {
      await upload(file);
    } catch {
      // error surfaced via hook if needed
    }
  }

  return (
    <div className="-mx-4">
      <div className="relative h-28 bg-gradient-to-r from-brand-200/80 via-brand-100 to-stone-100 sm:h-32">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.6) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(20,116,110,0.15) 0%, transparent 45%)",
          }}
        />
      </div>

      <div className="relative px-4 pb-3">
        <div className="flex items-end justify-between gap-3">
          <div className="relative -mt-10 shrink-0">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-brand-100 ring-4 ring-white sm:h-[5.25rem] sm:w-[5.25rem]">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-brand-800">
                  {profileInitial(displayName)}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="focus-ring absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full border border-stone-200 bg-white text-brand-800 shadow-sm hover:bg-brand-50 disabled:opacity-60"
              aria-label="Change profile photo"
            >
              <CameraIcon />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={disabled || isUploading}
              onChange={handleAvatarPick}
            />
          </div>

          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="focus-ring mb-1 flex size-9 shrink-0 items-center justify-center rounded-full text-brand-700 hover:bg-brand-50"
              aria-label="Edit profile"
            >
              <EditIcon className="size-[1.125rem]" />
            </button>
          ) : null}
        </div>

        <div className="mt-3 min-w-0">
          <h1 className="font-display text-xl font-bold leading-tight text-brand-900 sm:text-2xl">
            <UserDisplayName
              name={displayName}
              isPro={isPremium}
              nameClassName="min-w-0 break-words"
              badgeClassName="size-4 shrink-0"
            />
          </h1>
          {profile.bio ? <p className="mt-1 text-sm leading-relaxed text-stone-700">{profile.bio}</p> : null}
          <p className="mt-1 text-xs text-stone-500">
            {profile.username ? `@${profile.username}` : null}
            {profile.username && universityLine ? " • " : null}
            {universityLine ? <span className="text-brand-800/90">{universityLine}</span> : null}
          </p>
          {profile.distinction ? <p className="mt-0.5 text-xs text-stone-600">{profile.distinction}</p> : null}
        </div>
      </div>
    </div>
  );
}
