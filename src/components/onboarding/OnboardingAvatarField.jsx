import { uploadProfileAvatar } from "../../lib/profile.js";

function avatarInitial(displayName) {
  const letter = String(displayName || "S")
    .trim()
    .charAt(0)
    .toUpperCase();
  return letter || "S";
}

/**
 * @param {{
 *   url: string,
 *   displayName: string,
 *   onUrlChange: (url: string) => void,
 *   disabled?: boolean,
 * }} props
 */
export default function OnboardingAvatarField({ url, displayName, onUrlChange, disabled = false }) {
  async function handlePick(file) {
    const nextUrl = await uploadProfileAvatar(file);
    onUrlChange(nextUrl);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-100 ring-2 ring-brand-200">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-brand-800" aria-hidden>
            {avatarInitial(displayName)}
          </span>
        )}
      </div>
      <div>
        <label className="block">
          <span className="sr-only">Profile picture</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handlePick(file).catch(() => {});
              event.target.value = "";
            }}
            className="block w-full max-w-xs text-sm text-stone-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-800 hover:file:bg-brand-100 disabled:opacity-60"
          />
        </label>
        <p className="mt-1 text-xs text-stone-500">Optional. Max 2MB. We use your initial if you skip.</p>
      </div>
    </div>
  );
}
