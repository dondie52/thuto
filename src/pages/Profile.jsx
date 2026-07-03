import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfileEditForm, {
  AboutIcon,
  PersonIcon,
  ProfileAboutFields,
  ProfileFieldsOfInterest,
  ProfilePersonalFields,
  ProfileUniversitiesFields,
  StarIcon,
  UniversityIcon,
} from "../components/ProfileEditForm.jsx";
import AccountActivitySummary from "../components/profile/AccountActivitySummary.jsx";
import ChangePasswordForm from "../components/profile/ChangePasswordForm.jsx";
import DeleteAccountForm from "../components/profile/DeleteAccountForm.jsx";
import NotificationPreferences from "../components/profile/NotificationPreferences.jsx";
import ProfileHero from "../components/profile/ProfileHero.jsx";
import ProfileSection from "../components/profile/ProfileSection.jsx";
import ProfileSectionNav, { useProfileTab } from "../components/profile/ProfileSectionNav.jsx";
import { PREDICTOR_BEST_SIX_STORAGE_KEY, PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY } from "../lib/admissions.js";
import { openBillingPortal, canManageStripeBilling } from "../lib/billing.js";
import { getBookmarkIds } from "../lib/bookmarks.js";
import { useAuth } from "../lib/auth.jsx";
import { usesPasswordAuth } from "../lib/authRedirect.js";
import { syncFromCloud } from "../lib/cloudSync.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { fetchUnreadNotificationCount } from "../lib/notifications.js";
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

function PathwaySnapshot({ predictor, savedCount }) {
  return (
    <section className="border-b border-stone-200/70 py-4 sm:py-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pathway snapshot</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-brand-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Best six</p>
          <p className="mt-2 text-3xl font-bold text-brand-900">{predictor.total == null ? "--" : predictor.total}</p>
        </div>
        <div className="rounded-xl bg-brand-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Subject keys</p>
          <p className="mt-2 text-3xl font-bold text-brand-900">{predictor.requirementCount}</p>
        </div>
        <div className="rounded-xl bg-brand-50/40 p-4">
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
  );
}

export default function Profile() {
  useDocumentTitle("Profile | Thuto");
  const { supabaseConfigured, user, profile, isPremium, refreshProfile, saveProfile, isProfileLoading, logout } =
    useAuth();
  const [activeTab, setActiveTab] = useProfileTab();
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingNotice, setBillingNotice] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const savedCount = getBookmarkIds().length;
  const predictor = readPredictorSummary();
  const isSignedIn = Boolean(user);
  const premiumUntil = formatPremiumUntil(profile);
  const publicProfileUrl = profilePath(profile?.username);
  const showSignedInContent = isSignedIn && supabaseConfigured;

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

  function handleEditProfile() {
    setActiveTab("about");
    window.setTimeout(() => {
      document.getElementById("personal-info")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  return (
    <div className="space-y-0">
      {showSignedInContent ? (
        <ProfileHero
          user={user}
          profile={profile}
          isPremium={isPremium}
          onSave={saveProfile}
          onEdit={handleEditProfile}
          disabled={isProfileLoading}
        />
      ) : null}

      <ProfileSectionNav activeTab={activeTab} onTabChange={setActiveTab} signedIn={showSignedInContent} />

      {!isSignedIn ? (
        <>
          <ProfileSection
            id="personal-info"
            title="Personal information"
            description="Create an account to save your profile, shortlist, and predictor progress."
          >
            <p className="mb-4 text-sm text-slate-600">Sign in to sync your pathway and manage account settings.</p>
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
          <PathwaySnapshot predictor={predictor} savedCount={savedCount} />
        </>
      ) : null}

      {showSignedInContent ? (
        <>
          {activeTab === "about" ? (
            <ProfileEditForm profile={profile} onSave={saveProfile} disabled={isProfileLoading}>
              <ProfileSection id="about-summary" title="About" hideDescription icon={<AboutIcon />}>
                <ProfileAboutFields />
              </ProfileSection>
              <ProfileSection
                id="universities"
                title="Universities you're interested in"
                hideDescription
                icon={<UniversityIcon />}
              >
                <ProfileUniversitiesFields />
              </ProfileSection>
              <ProfileSection id="fields-of-interest" title="Fields of interest" hideDescription icon={<StarIcon />}>
                <ProfileFieldsOfInterest />
              </ProfileSection>
              <ProfileSection
                id="personal-info"
                title="Personal information"
                hideDescription
                icon={<PersonIcon />}
              >
                <ProfilePersonalFields />
              </ProfileSection>
            </ProfileEditForm>
          ) : null}

          {activeTab === "activity" ? (
            <ProfileSection
              id="activity"
              title="Account activity"
              description="Review sign-in history and recent notifications on your account."
            >
              <AccountActivitySummary user={user} unreadCount={unreadCount} />
            </ProfileSection>
          ) : null}

          {activeTab === "connections" ? (
            <ProfileSection
              id="connections"
              title="Connected accounts"
              description="Manage your feed connections and people you interact with on Thuto."
            >
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  You can sign in with Google or email. Social connections on the feed are managed separately from your
                  login method.
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
          ) : null}

          {activeTab === "privacy" ? (
            <ProfileSection
              id="privacy"
              title="Privacy settings"
              description="Control who can contact you and review how Thuto handles your data."
            >
              <div className="space-y-4">
                <div className="rounded-xl bg-brand-50/50 px-3 py-3 text-sm">
                  <p className="font-semibold text-brand-900">Who can message you</p>
                  <p className="mt-1 text-stone-700">
                    {MESSAGE_PRIVACY_LABELS[profile?.message_privacy] || MESSAGE_PRIVACY_LABELS.everyone}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("about");
                      window.setTimeout(() => {
                        document.getElementById("about-summary")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 0);
                    }}
                    className="focus-ring mt-3 inline-flex text-xs font-semibold text-brand-800 underline"
                  >
                    Edit in About
                  </button>
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
          ) : null}

          {activeTab === "billing" ? (
            <>
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
                        Upgrade to Pro for unlimited saves, deadline alerts, acceptance chance, and compare up to 3
                        programmes.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isPremium && canManageStripeBilling(profile) ? (
                      <button
                        type="button"
                        disabled={billingLoading}
                        onClick={handleManageBilling}
                        className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
                      >
                        {billingLoading ? "Opening portal..." : "Manage billing"}
                      </button>
                    ) : null}
                    {!isPremium ? (
                      <Link
                        to="/upgrade"
                        className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
                      >
                        Upgrade to Pro
                      </Link>
                    ) : null}
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
                description="Review payment history and receipts (Stripe customers only)."
              >
                <div className="space-y-4">
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500">Billing status</dt>
                      <dd className="font-semibold text-brand-900">{isPremium ? "Pro active" : "No active Pro plan"}</dd>
                    </div>
                    {isPremium && premiumUntil ? (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-slate-500">Renews / ends</dt>
                        <dd className="font-semibold text-brand-900">{premiumUntil}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {canManageStripeBilling(profile) ? (
                    <button
                      type="button"
                      disabled={billingLoading}
                      onClick={handleManageBilling}
                      className="focus-ring rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:opacity-60"
                    >
                      {billingLoading ? "Opening portal..." : "Open billing portal"}
                    </button>
                  ) : isPremium ? (
                    <p className="text-sm text-slate-600">
                      Pro payments are handled by Flutterwave. Contact support if you need a receipt.
                    </p>
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
            </>
          ) : null}

          {activeTab === "settings" ? (
            <>
              <ProfileSection
                id="security"
                title="Security"
                description="Change your password and review how others see your public profile."
              >
                <div className="space-y-5">
                  <div className="rounded-xl bg-brand-50/50 px-3 py-3 text-sm">
                    <p className="font-semibold text-brand-900">Signed in as</p>
                    <p className="mt-1 text-stone-700">{user.email}</p>
                  </div>
                  {!usesPasswordAuth(user) ? (
                    <p className="rounded-xl bg-brand-50/50 px-3 py-3 text-sm text-stone-700">
                      You signed in with Google, so password changes are managed through your Google account.
                    </p>
                  ) : (
                    <ChangePasswordForm />
                  )}
                  {publicProfileUrl ? (
                    <div className="rounded-xl bg-brand-50/40 px-3 py-3">
                      <p className="text-sm font-semibold text-brand-900">Public profile</p>
                      <p className="mt-1 text-xs text-stone-600">
                        See how your profile appears to other students on the feed.
                      </p>
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
                id="notifications"
                title="Notification preferences"
                description="Control which alerts you receive in your feed inbox."
              >
                <NotificationPreferences />
              </ProfileSection>

              <ProfileSection
                id="support"
                title="Support"
                description="Get help, report a problem, or share feedback with the Thuto team."
              >
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Need help with applications, your account, or a technical issue? Our support form is the fastest way
                    to reach the team.
                  </p>
                  <Link
                    to="/support"
                    className="focus-ring inline-flex rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
                  >
                    Contact support
                  </Link>
                </div>
              </ProfileSection>

              <section className="border-b border-red-200/70 bg-red-50/30 py-4 sm:py-5">
                <h2 className="font-display text-lg font-semibold text-red-900">Delete account</h2>
                <p className="mt-1 text-sm text-red-800/90">
                  Permanently remove your Thuto account, profile, and synced data from our servers.
                </p>
                <div className="mt-4">
                  <DeleteAccountForm />
                </div>
              </section>

              <section className="border-b border-red-200/70 bg-red-50/30 py-4 sm:py-5">
                <h2 className="font-display text-lg font-semibold text-red-900">Sign out</h2>
                <p className="mt-1 text-sm text-red-800/90">End your session on this device.</p>
                {logoutError ? (
                  <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-red-800">{logoutError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="focus-ring mt-4 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Log out
                </button>
              </section>

              <PathwaySnapshot predictor={predictor} savedCount={savedCount} />
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
