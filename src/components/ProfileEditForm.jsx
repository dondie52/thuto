import { createContext, useContext, useEffect, useState } from "react";
import { fetchUniversities } from "../lib/universitiesData.js";
import { fetchTargetInstitutions, saveTargetInstitutions } from "../lib/onboarding.js";
import { resolveMarketCountry, setMarketCountry } from "../lib/marketCountry.js";
import { formatAuthorUniversity, PROFILE_SCHEMA_UNAVAILABLE_MESSAGE } from "../lib/profile.js";
import FieldInterestPills from "./onboarding/FieldInterestPills.jsx";
import InstitutionMultiSelect from "./onboarding/InstitutionMultiSelect.jsx";
import MarketCountrySelect from "./MarketCountrySelect.jsx";
import UsernameInput from "./onboarding/UsernameInput.jsx";
import { normalizeUsername } from "../lib/username.js";

const MAX_INSTITUTIONS = 10;
const MAX_FIELD_OPTIONS = 8;

const ProfileEditFormContext = createContext(null);

export function useProfileEditFormContext() {
  const context = useContext(ProfileEditFormContext);
  if (!context) {
    throw new Error("Profile edit fields must be used within ProfileEditForm.");
  }
  return context;
}

function profileSaveErrorMessage(err) {
  const message = err?.message || "Could not save profile.";
  if (/duplicate key|profiles_username_lower_idx/i.test(message)) {
    return "This username is already taken. Try another.";
  }
  if (/permission denied for table user_target_institutions/i.test(message)) {
    return "Could not save your university choices. Please try again in a moment.";
  }
  if (message === PROFILE_SCHEMA_UNAVAILABLE_MESSAGE) {
    return message;
  }
  if (/schema cache/i.test(message) || /could not find the ['"]?bio['"]? column/i.test(message)) {
    return PROFILE_SCHEMA_UNAVAILABLE_MESSAGE;
  }
  return message;
}

function useProfileEditFormState(profile, onSave, disabled) {
  const [universities, setUniversities] = useState([]);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [usernameValid, setUsernameValid] = useState(true);
  const [country, setCountry] = useState(() => resolveMarketCountry(profile));
  const [targetInstitutionIds, setTargetInstitutionIds] = useState([]);
  const [fieldsOfInterest, setFieldsOfInterest] = useState([]);
  const [distinction, setDistinction] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [messagePrivacy, setMessagePrivacy] = useState("everyone");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    setMarketCountry(country);
    fetchUniversities({ country })
      .then(({ list }) => {
        if (!active) return;
        setUniversities(list);
        setTargetInstitutionIds((current) => current.filter((id) => list.some((uni) => uni.id === id)));
      })
      .catch(() => {
        if (active) setUniversities([]);
      });
    return () => {
      active = false;
    };
  }, [country]);

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setUsername(profile?.username || "");
    setBio(profile?.bio || profile?.distinction || "");
    setUsernameValid(Boolean(profile?.username));
    setFieldsOfInterest(profile?.fields_of_interest || []);
    setDistinction(profile?.distinction || "");
    setAvatarUrl(profile?.avatar_url || "");
    setMessagePrivacy(profile?.message_privacy || "everyone");
    if (profile?.country) setCountry(profile.country);
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

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const primary = universities.find((uni) => uni.id === targetInstitutionIds[0]);
      setMarketCountry(country);
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
        messagePrivacy,
        country,
      });
      await saveTargetInstitutions(targetInstitutionIds);
      setNotice("Saved.");
    } catch (err) {
      setError(profileSaveErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return {
    profile,
    disabled,
    universities,
    fullName,
    setFullName,
    username,
    setUsername,
    bio,
    setBio,
    usernameValid,
    setUsernameValid,
    country,
    setCountry,
    targetInstitutionIds,
    setTargetInstitutionIds,
    fieldsOfInterest,
    setFieldsOfInterest,
    distinction,
    setDistinction,
    avatarUrl,
    messagePrivacy,
    setMessagePrivacy,
    isSaving,
    error,
    notice,
    previewUniversity,
    selectedUniversities,
    handleSubmit,
  };
}

function FormFeedback() {
  const { notice, error } = useProfileEditFormContext();
  return (
    <>
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
    </>
  );
}

export function ProfileAboutFields() {
  const { bio, setBio, distinction, setDistinction, messagePrivacy, setMessagePrivacy, disabled, isSaving } =
    useProfileEditFormContext();

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs font-semibold text-stone-600">Bio</span>
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

      <label className="block">
        <span className="text-xs font-semibold text-stone-600">Who can message you</span>
        <select
          value={messagePrivacy}
          onChange={(event) => setMessagePrivacy(event.target.value)}
          disabled={disabled || isSaving}
          className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
        >
          <option value="everyone">Everyone on Thuto</option>
          <option value="followers_only">People you follow or who follow you</option>
          <option value="connections_only">Accepted connections only</option>
        </select>
      </label>
    </div>
  );
}

export function ProfileUniversitiesFields() {
  const {
    universities,
    targetInstitutionIds,
    setTargetInstitutionIds,
    country,
    setCountry,
    disabled,
    isSaving,
  } = useProfileEditFormContext();

  return (
    <div className="space-y-4">
      <MarketCountrySelect
        id="profile-country"
        value={country}
        onChange={setCountry}
        disabled={disabled || isSaving}
        label="Country"
        hint="Changing country updates the institution list and clears selections from the other market."
      />
      <div>
        <div className="mt-2">
          <InstitutionMultiSelect
            universities={universities}
            selectedIds={targetInstitutionIds}
            onChange={setTargetInstitutionIds}
            max={MAX_INSTITUTIONS}
            disabled={disabled || isSaving}
          />
        </div>
        <p className="mt-2 text-xs text-stone-500">
          {targetInstitutionIds.length} of {MAX_INSTITUTIONS} selected • Select up to {MAX_INSTITUTIONS} institutions to
          seed your feed.
        </p>
      </div>
    </div>
  );
}

export function ProfileFieldsOfInterest() {
  const { fieldsOfInterest, setFieldsOfInterest, disabled, isSaving } = useProfileEditFormContext();

  return (
    <div>
      <div className="mt-2">
        <FieldInterestPills selected={fieldsOfInterest} onChange={setFieldsOfInterest} disabled={disabled || isSaving} />
      </div>
      <p className="mt-2 text-xs text-stone-500">
        {fieldsOfInterest.length} of {MAX_FIELD_OPTIONS} selected • Choose the areas you&apos;re most interested in.
      </p>
    </div>
  );
}

export function ProfilePersonalFields() {
  const {
    fullName,
    setFullName,
    username,
    setUsername,
    profile,
    disabled,
    isSaving,
    usernameValid,
    setUsernameValid,
    previewUniversity,
    selectedUniversities,
  } = useProfileEditFormContext();

  return (
    <div className="space-y-4">
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

      <FormFeedback />

      <ProfileSaveButton usernameValid={usernameValid} />
    </div>
  );
}

function ProfileSaveButton({ usernameValid }) {
  const { disabled, isSaving, username } = useProfileEditFormContext();
  return (
    <button
      type="submit"
      disabled={disabled || isSaving || (username.trim() && !usernameValid)}
      className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSaving ? "Saving..." : "Save profile"}
    </button>
  );
}

function AboutIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UniversityIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/**
 * @param {{
 *   profile: object | null,
 *   onSave: (patch: object) => Promise<object>,
 *   disabled?: boolean,
 *   children?: import("react").ReactNode,
 * }} props
 */
export default function ProfileEditForm({ profile, onSave, disabled = false, children }) {
  const formState = useProfileEditFormState(profile, onSave, disabled);

  return (
    <ProfileEditFormContext.Provider value={formState}>
      <form className="space-y-0" onSubmit={formState.handleSubmit}>
        {children || (
          <>
            <ProfileAboutFields />
            <ProfileUniversitiesFields />
            <ProfileFieldsOfInterest />
            <ProfilePersonalFields />
          </>
        )}
      </form>
    </ProfileEditFormContext.Provider>
  );
}

export { AboutIcon, UniversityIcon, StarIcon, PersonIcon };
