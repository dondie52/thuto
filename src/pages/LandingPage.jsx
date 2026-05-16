import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import ScrollStory from "../components/landing/ScrollStory.jsx";
import AboutSection from "../components/landing/AboutSection.jsx";
import LandingFooter from "../components/landing/LandingFooter.jsx";

export default function LandingPage() {
  useDocumentTitle("Thuto - Botswana University Companion");

  return (
    <div className="flex flex-1 flex-col">
      <ScrollStory />
      <AboutSection />
      <LandingFooter />
    </div>
  );
}
