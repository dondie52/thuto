import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import SplashScreen from "./components/SplashScreen.jsx";
import { useRouteSeo } from "./hooks/useRouteSeo.js";

const LandingLayout = lazy(() => import("./components/landing/LandingLayout.jsx"));
const Layout = lazy(() => import("./components/Layout.jsx"));
const AuthRoute = lazy(() => import("./components/AuthRoute.jsx"));
const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
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
const ShareAdmissionResult = lazy(() => import("./pages/ShareAdmissionResult.jsx"));
const Disclaimer = lazy(() => import("./pages/Disclaimer.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Privacy = lazy(() => import("./pages/Privacy.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Sponsorships = lazy(() => import("./pages/Sponsorships.jsx"));
const Support = lazy(() => import("./pages/Support.jsx"));
const Upgrade = lazy(() => import("./pages/Upgrade.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.jsx"));

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

function getInitialSplashPhase() {
  if (typeof window === "undefined") return "hidden";
  return window.sessionStorage.getItem("thuto:splash-seen") === "1" ? "hidden" : "enter";
}

export default function App() {
  const [splashPhase, setSplashPhase] = useState(getInitialSplashPhase);
  useRouteSeo();

  useEffect(() => {
    if (splashPhase === "hidden") return undefined;
    window.sessionStorage.setItem("thuto:splash-seen", "1");
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
    <>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route
            path="/login"
            element={
              <AuthRoute>
                <AuthPage mode="login" />
              </AuthRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <AuthRoute>
                <AuthPage mode="signup" />
              </AuthRoute>
            }
          />
          <Route element={<LandingLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>
          <Route
            element={
              <AuthRoute>
                <Layout />
              </AuthRoute>
            }
          >
            <Route path="/app" element={<Home />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/auth" element={<Auth />} />
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
            <Route path="/support" element={<Support />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      {splashPhase !== "hidden" && <SplashScreen exiting={splashPhase === "exit"} />}
    </>
  );
}
