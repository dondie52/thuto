import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import OnboardingStepIndicator from "../components/onboarding/OnboardingStepIndicator.jsx";
import UsernameInput from "../components/onboarding/UsernameInput.jsx";
import OnboardingAvatarField from "../components/onboarding/OnboardingAvatarField.jsx";
import InstitutionMultiSelect from "../components/onboarding/InstitutionMultiSelect.jsx";
import FieldInterestPills from "../components/onboarding/FieldInterestPills.jsx";
import PredictorGradeSection from "../components/PredictorGradeSection.jsx";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { usePredictorGradeInput } from "../hooks/usePredictorGradeInput.js";
import {
  fetchGradeEntries,
  fetchTargetInstitutions,
  finishOnboarding,
  saveGradeEntries,
  saveTargetInstitutions,
} from "../lib/onboarding.js";
import { filterSubjectsBySyllabus, SPONSORSHIP_INTENT_OPTIONS, SYLLABUS_OPTIONS } from "../lib/syllabus.js";
import { fetchUniversities } from "../lib/universitiesData.js";
import { normalizeUsername, validateUsername } from "../lib/username.js";
import { safeInternalPath } from "../lib/urlSafety.js";

const STEPS = [
  { id: "identity", label: "Account" },
  { id: "social", label: "Profile" },
  { id: "academics", label: "Grades" },
  { id: "sponsorship", label: "Funding" },
];

export default function Onboarding() {
  useDocumentTitle("Set up your profile | Thuto");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = safeInternalPath(searchParams.get("next")) || "/app";
  const { user, profile, saveProfile, refreshProfile, supabaseConfigured, isProfileLoading } = useAuth();

  const [step, setStep] = useState("identity");
  const [completedSteps, setCompletedSteps] = useState(() => new Set());
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [universities, setUniversities] = useState([]);
  const [targetInstitutionIds, setTargetInstitutionIds] = useState([]);
  const [fieldsOfInterest, setFieldsOfInterest] = useState([]);
  const [syllabusType, setSyllabusType] = useState("");
  const [sponsorshipIntent, setSponsorshipIntent] = useState("");

  const {
    rows,
    chosenSubjectIds,
    validationMessage,
    breakdown,
    updateRow,
    addRow,
    removeRow,
    canAdd,
    replaceRows,
    bgcseSubjects,
  } = usePredictorGradeInput();

  const filteredSubjects = useMemo(
    () => filterSubjectsBySyllabus(syllabusType, bgcseSubjects),
    [syllabusType, bgcseSubjects],
  );

  const gradesReady = Boolean(
    !validationMessage && breakdown && !breakdown.invalid && breakdown.counted.length > 0,
  );

  useEffect(() => {
    if (!user) return;
    if (!isProfileLoading && profile?.username && (profile.onboarding_completed_at || profile.onboarding_skipped_at)) {
      navigate(nextPath, { replace: true });
    }
  }, [user, profile, isProfileLoading, navigate, nextPath]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setUsername(profile.username || "");
    setBio(profile.bio || profile.distinction || "");
    setAvatarUrl(profile.avatar_url || "");
    setFieldsOfInterest(profile.fields_of_interest || []);
    setSyllabusType(profile.syllabus_type || "");
    setSponsorshipIntent(profile.sponsorship_intent || "");
    if (profile.username) setUsernameValid(true);
  }, [profile]);

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
    if (!user) return;
    let active = true;
    Promise.all([fetchTargetInstitutions(), fetchGradeEntries()])
      .then(([targets, grades]) => {
        if (!active) return;
        setTargetInstitutionIds(targets);
        if (grades.length) {
          replaceRows(
            grades.map((entry, index) => ({
              key: `saved-${entry.subjectId}-${index}`,
              subjectId: entry.subjectId,
              grade: entry.grade,
            })),
          );
        }
      })
      .catch(() => {
        /* optional data */
      });
    return () => {
      active = false;
    };
  }, [user, replaceRows]);

  const identityReady = useMemo(() => {
    const nameOk = fullName.trim().length >= 2;
    const userOk = validateUsername(normalizeUsername(username)).valid && usernameValid;
    return nameOk && userOk;
  }, [fullName, username, usernameValid]);

  function markStepDone(stepId) {
    setCompletedSteps((current) => new Set([...current, stepId]));
  }

  async function persistIdentity() {
    await saveProfile({
      fullName: fullName.trim(),
      username: normalizeUsername(username),
      bio: bio.trim(),
      avatarUrl,
    });
  }

  async function persistSocial() {
    await saveProfile({ fieldsOfInterest });
    await saveTargetInstitutions(targetInstitutionIds);
    if (targetInstitutionIds[0]) {
      const primary = universities.find((uni) => uni.id === targetInstitutionIds[0]);
      if (primary) {
        await saveProfile({
          universityId: primary.id,
          universityName: primary.name,
          universityStatus: "aspiring",
        });
      }
    }
  }

  async function persistAcademics() {
    if (syllabusType) {
      await saveProfile({ syllabusType });
    }
    if (gradesReady) {
      const entries = rows
        .filter((row) => row.subjectId && row.grade?.trim())
        .map((row) => ({ subjectId: row.subjectId, grade: row.grade }));
      await saveGradeEntries(entries);
    }
  }

  async function persistSponsorship() {
    if (sponsorshipIntent) {
      await saveProfile({ sponsorshipIntent });
    }
  }

  async function handleContinue() {
    setIsSaving(true);
    setError("");
    try {
      if (step === "identity") {
        await persistIdentity();
        markStepDone("identity");
        setStep("social");
      } else if (step === "social") {
        await persistSocial();
        markStepDone("social");
        setStep("academics");
      } else if (step === "academics") {
        await persistAcademics();
        markStepDone("academics");
        setStep("sponsorship");
      } else {
        await persistSponsorship();
        await finishOnboarding("complete");
        await refreshProfile();
        navigate(nextPath, { replace: true });
      }
    } catch (err) {
      const message = err.message || "Could not save your progress.";
      if (/duplicate key|profiles_username_lower_idx/i.test(message)) {
        setError("This username is already taken. Try another.");
      } else {
        setError(message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEnterThuto(skipMode = "skip") {
    if (!identityReady) {
      setError("Add your name and a unique username to continue.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await persistIdentity();
      await finishOnboarding(skipMode === "complete" ? "complete" : "skip");
      await refreshProfile();
      navigate(nextPath, { replace: true });
    } catch (err) {
      const message = err.message || "Could not save your profile.";
      if (/duplicate key|profiles_username_lower_idx/i.test(message)) {
        setError("This username is already taken. Try another.");
      } else {
        setError(message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSkipStep() {
    if (step === "identity") {
      await handleEnterThuto("skip");
      return;
    }
    if (step === "social") {
      setStep("academics");
      return;
    }
    if (step === "academics") {
      setStep("sponsorship");
      return;
    }
    await handleEnterThuto("complete");
  }

  if (!supabaseConfigured) {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Onboarding needs Supabase to be configured before accounts can be set up.
        </p>
        <Link to="/app" className="text-sm font-semibold text-brand-700 underline">
          Back to home
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Sign in to set up your Thuto profile.</p>
        <Link
          to={`/auth?mode=login&next=${encodeURIComponent("/onboarding")}`}
          className="inline-flex rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Welcome to Thuto</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-900">Set up your profile</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Add your name and username to get started. Everything else is optional and can be filled in later.
        </p>
      </header>

      <OnboardingStepIndicator steps={STEPS} currentStep={step} completedSteps={completedSteps} />

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {step === "identity" ? (
        <section className="space-y-4 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-900">Account & identity</h2>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Full name</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              maxLength={80}
              required
              autoComplete="name"
              placeholder="Your full name"
              className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </label>
          <UsernameInput
            value={username}
            onChange={setUsername}
            currentUserId={user.id}
            disabled={isSaving}
            onValidityChange={setUsernameValid}
          />
        </section>
      ) : null}

      {step === "social" ? (
        <section className="space-y-4 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-900">Social profile</h2>
          <OnboardingAvatarField
            url={avatarUrl}
            displayName={fullName}
            onUrlChange={setAvatarUrl}
            disabled={isSaving}
          />
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Bio / headline</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={150}
              rows={3}
              placeholder='e.g. "Aspiring software engineer looking to join BIUST"'
              className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <p className="mt-1 text-xs text-stone-500">{bio.length}/150 characters</p>
          </label>
          <div>
            <p className="text-xs font-semibold text-slate-600">Target institutions</p>
            <div className="mt-2">
              <InstitutionMultiSelect
                universities={universities}
                selectedIds={targetInstitutionIds}
                onChange={setTargetInstitutionIds}
                disabled={isSaving}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Fields of interest</p>
            <div className="mt-2">
              <FieldInterestPills selected={fieldsOfInterest} onChange={setFieldsOfInterest} disabled={isSaving} />
            </div>
          </div>
        </section>
      ) : null}

      {step === "academics" ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-brand-900">Syllabus / curriculum</h2>
            <p className="mt-1 text-xs text-stone-500">Required to unlock the Admission Predictor.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SYLLABUS_OPTIONS.map((option) => {
                const active = syllabusType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isSaving}
                    onClick={() => setSyllabusType(option.value)}
                    className={[
                      "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                      active
                        ? "border-brand-700 bg-brand-700 text-white"
                        : "border-brand-200 bg-white text-brand-900 hover:border-brand-400",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <PredictorGradeSection
            rows={rows}
            chosenSubjectIds={chosenSubjectIds}
            validationMessage={syllabusType ? validationMessage : "Choose a syllabus type above to add subjects."}
            breakdown={syllabusType ? breakdown : null}
            updateRow={updateRow}
            addRow={addRow}
            removeRow={removeRow}
            canAdd={canAdd && Boolean(syllabusType)}
            subjects={filteredSubjects}
          />
        </section>
      ) : null}

      {step === "sponsorship" ? (
        <section className="space-y-4 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-900">Sponsorship intent</h2>
          <p className="text-sm text-slate-600">We use this to tailor scholarship and funding announcements in your feed.</p>
          <div className="space-y-2">
            {SPONSORSHIP_INTENT_OPTIONS.map((option) => {
              const active = sponsorshipIntent === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isSaving}
                  onClick={() => setSponsorshipIntent(option.value)}
                  className={[
                    "w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition",
                    active
                      ? "border-brand-700 bg-brand-50 text-brand-900"
                      : "border-brand-200 bg-white text-brand-900 hover:border-brand-400",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={isSaving || (step === "identity" && !identityReady)}
          onClick={handleContinue}
          className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : step === "sponsorship" ? "Finish setup" : "Continue"}
        </button>
        {identityReady ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleEnterThuto(step === "sponsorship" ? "complete" : "skip")}
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
          >
            {step === "sponsorship" ? "Enter Thuto" : "Enter Thuto — set up later"}
          </button>
        ) : null}
        {step !== "identity" ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSkipStep}
            className="text-sm font-semibold text-brand-700 underline hover:text-brand-900 disabled:opacity-60"
          >
            Skip for now
          </button>
        ) : null}
      </div>
    </div>
  );
}
