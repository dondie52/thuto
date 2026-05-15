import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import LandingLayout from "./components/landing/LandingLayout.jsx";
import Layout from "./components/Layout.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import Home from "./pages/Home.jsx";
import Predictor from "./pages/Predictor.jsx";
import Programmes from "./pages/Programmes.jsx";
import ProgrammeDetail from "./pages/ProgrammeDetail.jsx";
import Universities from "./pages/Universities.jsx";
import UniversityDetail from "./pages/UniversityDetail.jsx";
import SavedProgrammes from "./pages/SavedProgrammes.jsx";
import CompareProgrammes from "./pages/CompareProgrammes.jsx";
import FitFinder from "./pages/FitFinder.jsx";
import Assistant from "./pages/Assistant.jsx";
import Auth from "./pages/Auth.jsx";
import ShareAdmissionResult from "./pages/ShareAdmissionResult.jsx";
import Disclaimer from "./pages/Disclaimer.jsx";
import Profile from "./pages/Profile.jsx";
import Privacy from "./pages/Privacy.jsx";
import Settings from "./pages/Settings.jsx";
import Sponsorships from "./pages/Sponsorships.jsx";
import Support from "./pages/Support.jsx";
import Upgrade from "./pages/Upgrade.jsx";
import NotFound from "./pages/NotFound.jsx";

const splashEnterMs = 1450;
const splashExitMs = 550;

export default function App() {
  const [splashPhase, setSplashPhase] = useState("enter");

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const enterMs = prefersReducedMotion ? 550 : splashEnterMs;
    const exitMs = prefersReducedMotion ? 80 : splashExitMs;
    const exitTimer = window.setTimeout(() => setSplashPhase("exit"), enterMs);
    const hideTimer = window.setTimeout(() => setSplashPhase("hidden"), enterMs + exitMs);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      <Routes>
        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
        <Route element={<Layout />}>
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
      {splashPhase !== "hidden" && <SplashScreen exiting={splashPhase === "exit"} />}
    </>
  );
}
