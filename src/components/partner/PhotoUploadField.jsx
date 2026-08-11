import { useState } from "react";
import { uploadContentAsset } from "../../lib/contentManagement.js";
import { resolveProgrammeThemeUrl } from "../../lib/programmeBranding.js";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

const FRAME_CLASS = {
  logo: "h-24 w-24",
  avatar: "h-16 w-16 rounded-full",
  wide: "h-32 w-full",
};

function errorMessage(err) {
  return err instanceof Error ? err.message : "Could not upload that photo.";
}

/**
 * Upload one image to the shared content bucket and hand back its public URL.
 * @param {{
 *   value: string,
 *   onChange: (url: string) => void,
 *   folder: string,
 *   label?: string,
 *   hint?: string,
 *   shape?: 'logo' | 'avatar' | 'wide',
 * }} props
 */
export function PhotoUploadField({ value, onChange, folder, label = "photo", hint, shape = "logo" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const frameClass = FRAME_CLASS[shape] || FRAME_CLASS.logo;
  const rounded = shape === "avatar" ? "" : "rounded-2xl";

  async function handlePick(file) {
    setBusy(true);
    setError("");
    try {
      onChange(await uploadContentAsset(file, folder));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div
        className={[
          "grid shrink-0 place-items-center overflow-hidden border border-slate-200 bg-white",
          frameClass,
          rounded,
        ].join(" ")}
      >
        {value ? (
          <img src={resolveProgrammeThemeUrl(value)} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="px-2 text-center text-[11px] font-medium text-slate-400">No photo</span>
        )}
      </div>
      <div className="min-w-0">
        <label
          className={[
            "inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50",
            busy ? "cursor-wait opacity-60" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {busy ? "Uploading…" : value ? `Replace ${label}` : `Add ${label}`}
          <input
            type="file"
            accept={ACCEPTED_TYPES}
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) handlePick(file);
            }}
          />
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => {
              setError("");
              onChange("");
            }}
            className="ml-2 text-sm font-semibold text-red-700 hover:text-red-900"
          >
            Remove
          </button>
        ) : null}
        <p className="mt-1.5 text-xs text-slate-500">{hint || "JPG, PNG or WebP. Max 10MB."}</p>
        {error ? <p className="mt-1 text-xs font-medium text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}

/**
 * Upload several images and keep them as an ordered list of public URLs.
 * @param {{ value: string[], onChange: (urls: string[]) => void, folder: string, hint?: string }} props
 */
export function PhotoGalleryField({ value, onChange, folder, hint }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const photos = Array.isArray(value) ? value : [];

  async function handlePick(files) {
    setBusy(true);
    setError("");
    const uploaded = [];
    try {
      for (const file of files) {
        uploaded.push(await uploadContentAsset(file, folder));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
      // Keep whatever finished before an error so partial uploads are not lost.
      if (uploaded.length) onChange([...new Set([...photos, ...uploaded])]);
    }
  }

  return (
    <div className="space-y-3">
      {photos.length ? (
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {photos.map((url) => (
            <div key={url} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img src={url} alt="" loading="lazy" className="h-32 w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(photos.filter((item) => item !== url))}
                className="w-full border-t border-slate-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
          No campus photos yet.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label
          className={[
            "inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50",
            busy ? "cursor-wait opacity-60" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {busy ? "Uploading…" : "Add photos"}
          <input
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              event.target.value = "";
              if (files.length) handlePick(files);
            }}
          />
        </label>
        <p className="text-xs text-slate-500">{hint || "JPG, PNG or WebP. Max 10MB each."}</p>
      </div>
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
