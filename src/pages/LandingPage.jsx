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
import PartnersTeaser from "../components/landing/PartnersTeaser.jsx";
import AboutSection from "../components/landing/AboutSection.jsx";
import LandingFooter from "../components/landing/LandingFooter.jsx";
import { usePageContent } from "../hooks/usePageContent.js";
import { PAGE_CONTENT_DEFAULTS } from "../lib/pageContentDefaults.js";

export default function LandingPage() {
  useDocumentTitle("Thuto - Botswana Tertiary Companion");
  const { hash } = useLocation();
  const { content } = usePageContent("landing", PAGE_CONTENT_DEFAULTS.landing);

  useEffect(() => {
    if (!hash) return;
    window.requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    });
  }, [hash]);

  return (
    <div className="flex flex-1 flex-col">
      <Hero content={content.hero} />
      <ProblemSection content={content.problem} />
      <HowItWorks content={content.howItWorks} />
      <Features content={content.features} />
      <UseCaseShowcase content={content.examples} />
      <UniversitiesSection content={content.universities} />
      <CTA content={content.cta} />
      <PartnersTeaser content={content.partnersTeaser} />
      <AboutSection content={content.about} />
      <LandingFooter content={content.footer} />
    </div>
  );
}
