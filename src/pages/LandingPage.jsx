import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import Hero from "../components/landing/Hero.jsx";
import ProblemSection from "../components/landing/ProblemSection.jsx";
import HowItWorks from "../components/landing/HowItWorks.jsx";
import Features from "../components/landing/Features.jsx";
import UseCaseShowcase from "../components/landing/UseCaseShowcase.jsx";
import UniversitiesSection from "../components/landing/UniversitiesSection.jsx";
import CTA from "../components/landing/CTA.jsx";
import AboutSection from "../components/landing/AboutSection.jsx";
import LandingFooter from "../components/landing/LandingFooter.jsx";

export default function LandingPage() {
  useDocumentTitle("Thuto - Botswana University Companion");

  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <Features />
      <UseCaseShowcase />
      <UniversitiesSection />
      <CTA />
      <AboutSection />
      <LandingFooter />
    </div>
  );
}
