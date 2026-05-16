import { useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    window.requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    });
  }, [hash]);

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
