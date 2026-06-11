import { useEffect, useState } from "react";
import { fetchUniversities } from "../lib/universitiesData.js";
import { fetchTargetInstitutions, saveTargetInstitutions } from "../lib/onboarding.js";
import { formatAuthorUniversity, uploadProfileAvatar } from "../lib/profile.js";
import FieldInterestPills from "./onboarding/FieldInterestPills.jsx";
import InstitutionMultiSelect from "./onboarding/InstitutionMultiSelect.jsx";
import UsernameInput from "./onboarding/UsernameInput.jsx";
import { normalizeUsername } from "../lib/username.js";

function ProfileAvatarPreview({ url, displayName, onPickFile, isUploading }) {
  const initial = String(displayName || "S")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-100 ring-2 ring-brand-200">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-brand-800" aria-hidden>
            {initial || "S"}
          </span>
        )}
      </div>
      <div>
        <label className="block">
          <span className="sr-only">Profile picture</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onPickFile(file);
              event.target.value = "";
            }}
            className="block w-full max-w-xs text-sm text-stone-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-800 hover:file:bg-brand-100 disabled:opacity-60"
          />
        </label>
        <p className="mt-1 text-xs text-stone-500">Max 2MB.</p>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   profile: object | null,
 *   onSave: (patch: object) => Promise<object>,
 *   disabled?: boolean,
 * }} props
 */
export default function ProfileEditForm({ profile, onSave, disabled = false }) {
  const [universities, setUniversities] = useState([]);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [usernameValid, setUsernameValid] = useState(true);
  const [targetInstitutionIds, setTargetInstitutionIds] = useState([]);
  const [fieldsOfInterest, setFieldsOfInterest] = useState([]);
  const [distinction, setDistinction] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    fetchUniversities()
      .then(({ list }) => {
        if (active) setUniversities(list);
      })
      .catch(() => {
        if (active) setUniversities([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setUsername(profile?.username || "");
    setBio(profile?.bio || profile?.distinction || "");
    setUsernameValid(Boolean(profile?.username));
    setFieldsOfInterest(profile?.fields_of_interest || []);
    setDistinction(profile?.distinction || "");
    setAvatarUrl(profile?.avatar_url || "");
  }, [profile]);

  useEffect(() => {
    if (!profile?.id) return;
    let active = true;
    fetchTargetInstitutions()
      .then((targets) => {
        if (!active) return;
        if (targets.length) {
          setTargetInstitutionIds(targets);
        } else if (profile.university_id) {
          setTargetInstitutionIds([profile.university_id]);
        } else {
          setTargetInstitutionIds([]);
        }
      })
      .catch(() => {
        if (!active) return;
        setTargetInstitutionIds(profile.university_id ? [profile.university_id] : []);
      });
    return () => {
      active = false;
    };
  }, [profile?.id, profile?.university_id]);

  const selectedUniversities = universities.filter((uni) => targetInstitutionIds.includes(uni.id));
  const previewUniversity = formatAuthorUniversity({
    universityName: selectedUniversities[0]?.name || profile?.university_name || "",
    universityStatus: profile?.university_status || "aspiring",
  });

  async function handleAvatarPick(file) {
    setIsUploading(true);
    setError("");
    setNotice("");
    try {
      const url = await uploadProfileAvatar(file);
      setAvatarUrl(url);
      await onSave({ avatarUrl: url });
      setNotice("Photo updated.");
    } catch (err) {
      setError(err.message || "Could not upload profile picture.");
    } finally {
      setIsUploading(false);
    }
  }

  function profileSaveErrorMessage(err) {
    const message = err?.message || "Could not save profile.";
    if (/duplicate key|profiles_username_lower_idx/i.test(message)) {
      return "This username is already taken. Try another.";
    }
    if (/permission denied for table user_target_institutions/i.test(message)) {
      return "Could not save your university choices. Please try again in a moment.";
    }
    return message;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const primary = universities.find((uni) => uni.id === targetInstitutionIds[0]);
      await onSave({
        fullName,
        username: normalizeUsername(username),
        bio,
        fieldsOfInterest,
        distinction,
        avatarUrl,
        universityId: primary?.id || "",
        universityName: primary?.name || "",
        universityStatus: primary
          ? profile?.university_id === primary.id
            ? profile?.university_status || "aspiring"
            : "aspiring"
          : "",
      });
      await saveTargetInstitutions(targetInstitutionIds);
      setNotice("Saved.");
    } catch (err) {
      setError(profileSaveErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <ProfileAvatarPreview
        url={avatarUrl}
        displayName={fullName}
        onPickFile={handleAvatarPick}
        isUploading={isUploading}
      />

      <label className="block">
        <span className="text-xs font-semibold text-stone-600">Display name</span>
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          maxLength={80}
          disabled={disabled || isSaving}
          placeholder="Your name"
          className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
        />
      </label>

      <UsernameInput
        value={username}
        onChange={setUsername}
        currentUserId={profile?.id}
        disabled={disabled || isSaving}
        onValidityChange={setUsernameValid}
      />

      <label className="block">
        <span className="text-xs font-semibold text-stone-600">Bio / headline</span>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={150}
          rows={3}
          disabled={disabled || isSaving}
          placeholder='e.g. "Aspiring software engineer looking to join BIUST"'
          className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
        />
      </label>

      <div>
        <p className="text-xs font-semibold text-stone-600">Universities you&apos;re interested in</p>
        <p className="mt-0.5 text-xs text-stone-500">Tick all institutions you want to follow or apply to.</p>
        <div className="mt-2">
          <InstitutionMultiSelect
            universities={universities}
            selectedIds={targetInstitutionIds}
            onChange={setTargetInstitutionIds}
            disabled={disabled || isSaving}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-stone-600">Fields of interest</p>
        <p className="mt-0.5 text-xs text-stone-500">Pick areas like science, business, health, and more.</p>
        <div className="mt-2">
          <FieldInterestPills
            selected={fieldsOfInterest}
            onChange={setFieldsOfInterest}
            disabled={disabled || isSaving}
          />
        </div>
      </div>

      {previewUniversity ? (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-900">
          On the feed: <span className="font-semibold">{previewUniversity}</span>
          {selectedUniversities.length > 1 ? (
            <span className="text-brand-800/80">
              {" "}
              and {selectedUniversities.length - 1} more institution{selectedUniversities.length > 2 ? "s" : ""}
            </span>
          ) : null}
        </p>
      ) : null}

      <label className="block">
        <span className="text-xs font-semibold text-stone-600">Tagline</span>
        <input
          value={distinction}
          onChange={(event) => setDistinction(event.target.value)}
          maxLength={120}
          disabled={disabled || isSaving}
          placeholder="e.g. First class hopeful, prefect, BGCSE 2025"
          className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
        />
      </label>

      {notice ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled || isSaving || isUploading || (username.trim() && !usernameValid)}
        className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
