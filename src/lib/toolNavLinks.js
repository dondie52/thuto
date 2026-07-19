/** Primary Thuto tools — order matches feed top navigation. */
export const primaryToolNavLinks = [
  { to: "/programmes", label: "Programmes", description: "Browse degrees, diplomas, and certificates", icon: "programmes" },
  {
    to: "/universities",
    label: "Tertiary Institutions",
    description: "Institutions, locations, and application windows",
    icon: "universities",
  },
  { to: "/sponsorships", label: "Sponsorships", description: "Government sponsorship, private funding, and grants", icon: "sponsorships" },
  {
    to: "/center",
    label: "Thuto Centre",
    description: "Campus notes, past papers, and study materials from students",
    icon: "center",
  },
  {
    to: "/postgraduate-studies",
    label: "Postgraduate Studies",
    description: "Master's, PhD programmes, and postgraduate scholarships",
    icon: "postgraduate",
  },
];

export const drawerPrimaryToolItems = [
  ...primaryToolNavLinks,
  { to: "/saved", label: "Saved Programmes", description: "Your shortlisted options", icon: "saved" },
  { to: "/compare", label: "Compare Programmes", description: "Review up to three options side by side", icon: "compare" },
];
