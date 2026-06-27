import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfileEditForm from "../components/ProfileEditForm.jsx";
import UserDisplayName from "../components/UserDisplayName.jsx";
import AccountActivitySummary from "../components/profile/AccountActivitySummary.jsx";
import ChangePasswordForm from "../components/profile/ChangePasswordForm.jsx";
import NotificationPreferences from "../components/profile/NotificationPreferences.jsx";
import ProfileSection from "../components/profile/ProfileSection.jsx";
import ProfileSectionNav from "../components/profile/ProfileSectionNav.jsx";
import { PREDICTOR_BEST_SIX_STORAGE_KEY, PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY } from "../lib/admissions.js";
import { openBillingPortal } from "../lib/billing.js";
import { getBookmarkIds } from "../lib/bookmarks.js";
import { useAuth } from "../lib/auth.jsx";
import { syncFromCloud } from "../lib/cloudSync.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { fetchUnreadNotificationCount } from "../lib/notifications.js";
import { formatAuthorUniversity } from "../lib/profile.js";
import { profilePath } from "../lib/profileLinks.js";
import { formatPremiumUntil } from "../lib/premium.js";

function readPredictorSummary() {
  try {
    const total = sessionStorage.getItem(PREDICTOR_BEST_SIX_STORAGE_KEY);
    const grades = sessionStorage.getItem(PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY);
    const parsedGrades = grades ? JSON.parse(grades) : null;
    return {
      total: total == null ? null : Number(total),
      requirementCount: parsedGrades && typeof parsedGrades === "object" ? Object.keys(parsedGrades).length : 0,
    };
  } catch {
    return { total: null, requirementCount: 0 };
  }
}

const MESSAGE_PRIVACY_LABELS = {
  everyone: "Everyone on Thuto",
  followers_only: "People you follow or who follow you",
  connections_only: "Accepted connections only",
};

export default function Profile() {
  useDocumentTitle("Profile | Thuto");
  const { supabaseConfigured, user, profile, isPremium, refreshProfile, saveProfile, isProfileLoading, logout } =
    useAuth();
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingNotice, setBillingNotice] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const savedCount = getBookmarkIds().length;
  const predictor = readPredictorSummary();
  const isSignedIn = Boolean(user);
  const premiumUntil = formatPremiumUntil(profile);
  const publicProfileUrl = profilePath(profile?.username);

  useEffect(() => {
    if (profile && isPremium) {
      syncFromCloud(profile);
    }
  }, [profile, isPremium]);

  useEffect(() => {
    if (!isSignedIn || !supabaseConfigured) {
      setUnreadCount(0);
      return undefined;
    }
    let active = true;
    fetchUnreadNotificationCount()
      .then((count) => {
        if (active) setUnreadCount(count);
      })
      .catch(() => {
        if (active) setUnreadCount(0);
      });
    return () => {
      active = false;
    };
  }, [isSignedIn, supabaseConfigured]);

  async function handleManageBilling() {
    setBillingLoading(true);
    setBillingNotice("");
    try {
      const url = await openBillingPortal();
      window.location.href = url;
    } catch (err) {
      setBillingNotice(err instanceof Error ? err.message : "Could not open billing portal.");
      setBillingLoading(false);
    }
  }

  async function handleLogout() {
    setLogoutError("");
    try {
      await logout();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Could not log out.");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Profile</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-900">Your account</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Manage your personal details, security, billing, notifications, privacy, support, activity, and connections in
          one place.
        </p>
        {!isSignedIn ? (
          <p className="mt-2 text-sm text-slate-600">Sign in to sync your pathway and manage account settings.</p>
        ) : null}
      </div>

      <ProfileSectionNav signedIn={isSignedIn && supabaseConfigured} />

      {!isSignedIn ? (
        <ProfileSection
          id="personal-info"
          title="Personal information"
          description="Create an account to save your profile, shortlist, and predictor progress."
        >
          <div className="flex flex-wrap gap-2">
            <Link
              to="/auth?mode=signup"
              className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
            >
              Sign up
            </Link>
            <Link
              to="/auth?mode=login"
              className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              Log in
            </Link>
          </div>
        </ProfileSection>
      ) : null}

      {isSignedIn && supabaseConfigured ? (
        <>
          <ProfileSection
            id="personal-info"
            title="Personal information"
            description="Update your name, photo, bio, universities, and interests."
          >
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-brand-50/80 px-3 py-3 text-sm text-brand-900">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-lg font-bold text-white">
                    {(profile.full_name || user.email || "S").trim().charAt(0).toUpperCase() || "S"}
                  </span>
                )}
                <div className="min-w-0">
                  <UserDisplayName
                    name={profile.full_name || user.email}
                    isPro={isPremium}
                    nameClassName="min-w-0 break-words font-semibold"
                  />
                  {profile.username ? <p className="text-xs font-semibold text-stone-500">@{profile.username}</p> : null}
                  {formatAuthorUniversity({
                    universityName: profile.university_name,
                    universityStatus: profile.university_status,
                  }) ? (
                    <p className="text-xs text-brand-800/90">
                      {formatAuthorUniversity({
                        universityName: profile.university_name,
                        universityStatus: profile.university_status,
                      })}
                    </p>
                  ) : null}
                  {profile.distinction ? <p className="text-xs text-stone-600">{profile.distinction}</p> : null}
                </div>
              </div>
            <ProfileEditForm profile={profile} onSave={saveProfile} disabled={isProfileLoading} />
          </ProfileSection>

          <ProfileSection
            id="security"
            title="Security"
            description="Change your password and review how others see your public profile."
          >
            <div className="space-y-5">
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-3 text-sm">
                <p className="font-semibold text-brand-900">Signed in as</p>
                <p className="mt-1 text-stone-700">{user.email}</p>
              </div>
              <ChangePasswordForm />
              {publicProfileUrl ? (
                <div className="rounded-xl border border-brand-100 bg-white px-3 py-3">
                  <p className="text-sm font-semibold text-brand-900">Public profile</p>
                  <p className="mt-1 text-xs text-stone-600">See how your profile appears to other students on the feed.</p>
                  <Link
                    to={publicProfileUrl}
                    className="focus-ring mt-3 inline-flex rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
                  >
                    View public profile
                  </Link>
                </div>
              ) : null}
            </div>
          </ProfileSection>

          <ProfileSection
            id="subscription"
            title="Subscription"
            description="Your Thuto plan, renewal date, and upgrade options."
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current plan</p>
                <p className="mt-2 font-display text-2xl font-semibold text-brand-900">{isPremium ? "Pro" : "Free"}</p>
                {isPremium && premiumUntil ? (
                  <p className="mt-1 text-sm text-slate-600">Active until {premiumUntil}.</p>
                ) : (
                  <p className="mt-1 text-sm text-slate-600">
                    Upgrade to Pro for unlimited saves, deadline alerts, acceptance chance, and compare up to 3 programmes.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {isPremium ? (
                  <button
                    type="button"
                    disabled={billingLoading || !profile?.stripe_customer_id}
                    onClick={handleManageBilling}
                    className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
                  >
                    {billingLoading ? "Opening portal..." : "Manage billing"}
                  </button>
                ) : (
                  <Link
                    to="/upgrade"
                    className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
                  >
                    Upgrade to Pro
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => refreshProfile()}
                  className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  Refresh plan status
                </button>
              </div>
            </div>
          </ProfileSection>

          <ProfileSection
            id="billing"
            title="Billing details"
            description="Review payment history and receipts in the Stripe customer portal."
          >
            <div className="space-y-4">
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Billing status</dt>
                  <dd className="font-semibold text-brand-900">
                    {isPremium ? "Pro active" : "No active Pro plan"}
                  </dd>
                </div>
                {isPremium && premiumUntil ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Renews / ends</dt>
                    <dd className="font-semibold text-brand-900">{premiumUntil}</dd>
                  </div>
                ) : null}
              </dl>
              {isPremium && profile?.stripe_customer_id ? (
                <button
                  type="button"
                  disabled={billingLoading}
                  onClick={handleManageBilling}
                  className="focus-ring rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:opacity-60"
                >
                  {billingLoading ? "Opening portal..." : "Open billing portal"}
                </button>
              ) : (
                <p className="text-sm text-slate-600">
                  Billing details appear here after you subscribe to Pro.{" "}
                  <Link to="/upgrade" className="font-semibold text-brand-800 underline">
                    View plans
                  </Link>
                </p>
              )}
              {billingNotice ? (
                <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900">{billingNotice}</p>
              ) : null}
            </div>
          </ProfileSection>

          <ProfileSection
            id="notifications"
            title="Notification preferences"
            description="Control which alerts you receive in your feed inbox."
          >
            <NotificationPreferences />
          </ProfileSection>

          <ProfileSection
            id="privacy"
            title="Privacy settings"
            description="Control who can contact you and review how Thuto handles your data."
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-3 text-sm">
                <p className="font-semibold text-brand-900">Who can message you</p>
                <p className="mt-1 text-stone-700">
                  {MESSAGE_PRIVACY_LABELS[profile?.message_privacy] || MESSAGE_PRIVACY_LABELS.everyone}
                </p>
                <a
                  href="#personal-info"
                  className="focus-ring mt-3 inline-flex text-xs font-semibold text-brand-800 underline"
                >
                  Edit in personal information
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/privacy"
                  className="focus-ring rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  Privacy policy
                </Link>
                <Link
                  to="/disclaimer"
                  className="focus-ring rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  Disclaimer
                </Link>
                <Link
                  to="/settings"
                  className="focus-ring rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  Local data controls
                </Link>
              </div>
            </div>
          </ProfileSection>

          <ProfileSection
            id="support"
            title="Support"
            description="Get help, report a problem, or share feedback with the Thuto team."
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Need help with applications, your account, or a technical issue? Our support form is the fastest way to
                reach the team.
              </p>
              <Link
                to="/support"
                className="focus-ring inline-flex rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
              >
                Contact support
              </Link>
            </div>
          </ProfileSection>

          <ProfileSection
            id="activity"
            title="Account activity"
            description="Review sign-in history and recent notifications on your account."
          >
            <AccountActivitySummary user={user} unreadCount={unreadCount} />
          </ProfileSection>

          <ProfileSection
            id="connections"
            title="Connected accounts"
            description="Manage your feed connections and people you interact with on Thuto."
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Thuto uses email sign-in. Social connections on the feed are managed separately from your login method.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/feed/people"
                  className="focus-ring rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
                >
                  Manage connections
                </Link>
                <Link
                  to="/feed/messages"
                  className="focus-ring rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  Open messages
                </Link>
              </div>
            </div>
          </ProfileSection>

          <section className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-red-900">Sign out</h2>
            <p className="mt-1 text-sm text-red-800/90">End your session on this device.</p>
            {logoutError ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-800">{logoutError}</p>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="focus-ring mt-4 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Log out
            </button>
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pathway snapshot</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Best six</p>
            <p className="mt-2 text-3xl font-bold text-brand-900">{predictor.total == null ? "--" : predictor.total}</p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Subject keys</p>
            <p className="mt-2 text-3xl font-bold text-brand-900">{predictor.requirementCount}</p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Saved</p>
            <p className="mt-2 text-3xl font-bold text-brand-900">{savedCount}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/predictor"
            className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
          >
            Open predictor
          </Link>
          <Link
            to="/saved"
            className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            View saved programmes
          </Link>
          <Link
            to="/feed"
            className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Open feed
          </Link>
        </div>
      </section>
    </div>
  );
}
