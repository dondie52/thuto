/** Institution partner tiers aligned with `institution_partners.tier`. */
export const PARTNER_TIERS = [
  {
    id: "verified",
    name: "Verified",
    priceLabel: "Pilot pricing",
    description: "Claim your profile, publish accurate programme data, and earn the verified badge.",
    highlighted: false,
  },
  {
    id: "insights",
    name: "Insights",
    priceLabel: "Contact us",
    description: "Everything in Verified plus analytics on profile views, programme interest, and apply clicks.",
    highlighted: false,
  },
  {
    id: "spotlight",
    name: "Spotlight",
    priceLabel: "Contact us",
    description: "Featured placement in the Thuto directory and landing surfaces during active campaigns.",
    highlighted: true,
  },
  {
    id: "growth",
    name: "Growth",
    priceLabel: "Contact us",
    description: "Full lead inbox, tracked apply links, and priority onboarding for admissions teams.",
    highlighted: false,
  },
];

export const PARTNER_TIER_FEATURES = [
  { feature: "Verified institution badge", verified: true, insights: true, spotlight: true, growth: true },
  { feature: "Self-service profile & programme CMS", verified: true, insights: true, spotlight: true, growth: true },
  { feature: "Analytics dashboard", verified: false, insights: true, spotlight: true, growth: true },
  { feature: "Tracked apply links", verified: false, insights: true, spotlight: true, growth: true },
  { feature: "Featured placement", verified: false, insights: false, spotlight: true, growth: true },
  { feature: "Student lead inbox", verified: false, insights: false, spotlight: false, growth: true },
];
