import { useCallback } from "react";
import { usePageContent } from "../../hooks/usePageContent.js";
import { PAGE_CONTENT_DEFAULTS } from "../../lib/pageContentDefaults.js";
import PartnersHero from "../partners/PartnersHero.jsx";
import PartnersLogos from "../partners/PartnersLogos.jsx";
import PartnersWhy from "../partners/PartnersWhy.jsx";
import PartnersWho from "../partners/PartnersWho.jsx";
import PartnersMission from "../partners/PartnersMission.jsx";
import PartnersPricing from "../partners/PartnersPricing.jsx";
import PartnerInquiryForm from "../partners/PartnerInquiryForm.jsx";
import PartnersCta from "../partners/PartnersCta.jsx";
import LandingFooter from "./LandingFooter.jsx";

/**
 * Institution-facing landing story: how Thuto helps institutions (CRM
 * features/benefits) and how to partner with us. Reuses the same content
 * and section components as the `/partners` page.
 */
export default function InstitutionLanding() {
  const { content } = usePageContent("partners", PAGE_CONTENT_DEFAULTS.partners);

  const scrollToInquiry = useCallback(() => {
    document.getElementById("partner-inquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-8 pb-24">
      <PartnersHero content={content.hero} onBookDemo={scrollToInquiry} />
      <PartnersLogos content={content.logos} />
      <PartnersWhy content={content.why} />
      <PartnersWho content={content.who} />
      <PartnersMission content={content.mission} />
      <PartnersPricing content={content.pricing} onBookDemo={scrollToInquiry} />
      <PartnerInquiryForm content={content.inquiry} />
      <PartnersCta content={content.cta} onBookDemo={scrollToInquiry} />
      <LandingFooter content={PAGE_CONTENT_DEFAULTS.landing.footer} />
    </div>
  );
}
