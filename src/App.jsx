import { Routes, Route } from "react-router-dom";
import LandingLayout from "./components/landing/LandingLayout.jsx";
import Layout from "./components/Layout.jsx";
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
import ShareAdmissionResult from "./pages/ShareAdmissionResult.jsx";
import Disclaimer from "./pages/Disclaimer.jsx";
import Privacy from "./pages/Privacy.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<LandingLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>
      <Route element={<Layout />}>
        <Route path="/app" element={<Home />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/fit-finder" element={<FitFinder />} />
        <Route path="/predictor" element={<Predictor />} />
        <Route path="/programmes" element={<Programmes />} />
        <Route path="/programmes/:id" element={<ProgrammeDetail />} />
        <Route path="/universities" element={<Universities />} />
        <Route path="/universities/:id" element={<UniversityDetail />} />
        <Route path="/saved" element={<SavedProgrammes />} />
        <Route path="/compare" element={<CompareProgrammes />} />
        <Route path="/share" element={<ShareAdmissionResult />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
