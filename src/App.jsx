import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import SplashScreen from "./components/SplashScreen.jsx";
import { useRouteSeo } from "./hooks/useRouteSeo.js";
import { AuthProvider } from "./lib/auth.jsx";

const LandingLayout = lazy(() => import("./components/landing/LandingLayout.jsx"));
const Layout = lazy(() => import("./components/Layout.jsx"));
const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const Feed = lazy(() => import("./pages/Feed.jsx"));
const FeedLayout = lazy(() => import("./components/FeedLayout.jsx"));
const FeedSearch = lazy(() => import("./pages/FeedSearch.jsx"));
const FeedPeople = lazy(() => import("./pages/FeedPeople.jsx"));
const PublicProfile = lazy(() => import("./pages/PublicProfile.jsx"));
const FeedMessages = lazy(() => import("./pages/FeedMessages.jsx"));
const FeedMessageThread = lazy(() => import("./pages/FeedMessageThread.jsx"));
const FeedNotifications = lazy(() => import("./pages/FeedNotifications.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const AdminFeed = lazy(() => import("./pages/AdminFeed.jsx"));
const Predictor = lazy(() => import("./pages/Predictor.jsx"));
const Programmes = lazy(() => import("./pages/Programmes.jsx"));
const ProgrammeDetail = lazy(() => import("./pages/ProgrammeDetail.jsx"));
const Universities = lazy(() => import("./pages/Universities.jsx"));
const UniversityDetail = lazy(() => import("./pages/UniversityDetail.jsx"));
const SavedProgrammes = lazy(() => import("./pages/SavedProgrammes.jsx"));
const CompareProgrammes = lazy(() => import("./pages/CompareProgrammes.jsx"));
const FitFinder = lazy(() => import("./pages/FitFinder.jsx"));
const Assistant = lazy(() => import("./pages/Assistant.jsx"));
const Auth = lazy(() => import("./pages/Auth.jsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.jsx"));
const ShareAdmissionResult = lazy(() => import("./pages/ShareAdmissionResult.jsx"));
const Disclaimer = lazy(() => import("./pages/Disclaimer.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Privacy = lazy(() => import("./pages/Privacy.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Sponsorships = lazy(() => import("./pages/Sponsorships.jsx"));
const Internships = lazy(() => import("./pages/Internships.jsx"));
const PostgraduateStudies = lazy(() => import("./pages/PostgraduateStudies.jsx"));
const Study = lazy(() => import("./pages/Study.jsx"));
const StudySubject = lazy(() => import("./pages/StudySubject.jsx"));
const Support = lazy(() => import("./pages/Support.jsx"));
const Upgrade = lazy(() => import("./pages/Upgrade.jsx"));
const UpgradeSuccess = lazy(() => import("./pages/UpgradeSuccess.jsx"));
const UpgradeCancel = lazy(() => import("./pages/UpgradeCancel.jsx"));
const ExternalRedirect = lazy(() => import("./pages/ExternalRedirect.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

const splashEnterMs = 520;
const splashExitMs = 180;

function PageFallback() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[var(--thuto-surface)] px-4" role="status" aria-label="Loading page">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-brand-100">
        <span className="block h-full w-1/2 animate-pulse rounded-full bg-brand-700" />
      </div>
    </div>
  );
}

function shouldShowBrandedSplash() {
  if (typeof window === "undefined") return false;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (isStandalone) return true;
  return window.sessionStorage.getItem("thuto:splash-seen") !== "1";
}

function getInitialSplashPhase() {
  return shouldShowBrandedSplash() ? "enter" : "hidden";
}

export default function App() {
  const [splashPhase, setSplashPhase] = useState(getInitialSplashPhase);
  useRouteSeo();

  useEffect(() => {
    if (splashPhase === "hidden") return undefined;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (!isStandalone) window.sessionStorage.setItem("thuto:splash-seen", "1");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const enterMs = prefersReducedMotion ? 120 : splashEnterMs;
    const exitMs = prefersReducedMotion ? 60 : splashExitMs;
    const exitTimer = window.setTimeout(() => setSplashPhase("exit"), enterMs);
    const hideTimer = window.setTimeout(() => setSplashPhase("hidden"), enterMs + exitMs);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, [splashPhase]);

  return (
    <AuthProvider>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
          <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />
          <Route element={<LandingLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>
          <Route element={<Layout />}>
            <Route path="/app" element={<Home />} />
            <Route path="/feed" element={<FeedLayout />}>
              <Route index element={<Feed />} />
              <Route path="search" element={<FeedSearch />} />
              <Route path="people" element={<FeedPeople />} />
              <Route path="u/:username" element={<PublicProfile />} />
              <Route path="messages" element={<FeedMessages />} />
              <Route path="messages/:conversationId" element={<FeedMessageThread />} />
              <Route path="notifications" element={<FeedNotifications />} />
            </Route>
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/feed" element={<AdminFeed />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/fit-finder" element={<FitFinder />} />
            <Route path="/predictor" element={<Predictor />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/programmes" element={<Programmes />} />
            <Route path="/programmes/:id" element={<ProgrammeDetail />} />
            <Route path="/universities" element={<Universities />} />
            <Route path="/universities/:id" element={<UniversityDetail />} />
            <Route path="/saved" element={<SavedProgrammes />} />
            <Route path="/compare" element={<CompareProgrammes />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/share" element={<ShareAdmissionResult />} />
            <Route path="/sponsorships" element={<Sponsorships />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/postgraduate-studies" element={<PostgraduateStudies />} />
            <Route path="/study" element={<Study />} />
            <Route path="/study/:subjectId" element={<StudySubject />} />
            <Route path="/support" element={<Support />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/go" element={<ExternalRedirect />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      {splashPhase !== "hidden" && <SplashScreen exiting={splashPhase === "exit"} />}
    </AuthProvider>
  );
}
