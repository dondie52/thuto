import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { usePageContent } from "../hooks/usePageContent.js";
import { PAGE_CONTENT_DEFAULTS } from "../lib/pageContentDefaults.js";
import PartnersHero from "../components/partners/PartnersHero.jsx";
import PartnersLogos from "../components/partners/PartnersLogos.jsx";
import PartnersWhy from "../components/partners/PartnersWhy.jsx";
import PartnersWho from "../components/partners/PartnersWho.jsx";
import PartnersMission from "../components/partners/PartnersMission.jsx";
import PartnersPricing from "../components/partners/PartnersPricing.jsx";
import PartnerInquiryForm from "../components/partners/PartnerInquiryForm.jsx";
import PartnersCta from "../components/partners/PartnersCta.jsx";

export default function Partners() {
  useDocumentTitle("Partners | Thuto");
  const { content } = usePageContent("partners", PAGE_CONTENT_DEFAULTS.partners);

  const scrollToInquiry = useCallback(() => {
    document.getElementById("partner-inquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="space-y-8 pb-24">
      <PartnersHero content={content.hero} onBookDemo={scrollToInquiry} />
      <PartnersLogos content={content.logos} />
      <PartnersWhy content={content.why} />
      <PartnersWho content={content.who} />
      <PartnersMission content={content.mission} />
      <PartnersPricing content={content.pricing} onBookDemo={scrollToInquiry} />
      <PartnerInquiryForm content={content.inquiry} />
      <PartnersCta content={content.cta} onBookDemo={scrollToInquiry} />
      <p className="text-sm text-slate-600">
        <Link to="/" className="font-semibold text-brand-800 underline hover:text-brand-950">
          Back to home
        </Link>
        {" · "}
        <Link to="/partner" className="font-semibold text-brand-800 underline hover:text-brand-950">
          Partner portal
        </Link>
      </p>
    </div>
  );
}
