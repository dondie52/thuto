import InstitutionCampaignBanner from "../InstitutionCampaignBanner.jsx";
import { INSTITUTION_CAMPAIGNS, getInstitutionCampaign } from "../../lib/institutionCampaigns.js";

/**
 * Active partner intake flyers on the Home advertising surface.
 */
export default function HomePartnerCampaigns() {
  const activeCampaigns = Object.values(INSTITUTION_CAMPAIGNS)
    .map((campaign) => {
      const active = getInstitutionCampaign(campaign.institutionId);
      if (!active) return null;
      return active;
    })
    .filter(Boolean);

  if (activeCampaigns.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="home-partner-campaigns-heading">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Partner promotion</p>
        <h2 id="home-partner-campaigns-heading" className="font-display text-2xl font-bold text-brand-900">
          Institution intake highlights
        </h2>
      </div>
      <div className="space-y-6">
        {activeCampaigns.map((campaign) => (
          <InstitutionCampaignBanner
            key={campaign.institutionId}
            institutionId={campaign.institutionId}
            institutionName={campaign.institutionName}
          />
        ))}
      </div>
    </section>
  );
}
