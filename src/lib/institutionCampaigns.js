/**
 * Active institution marketing campaigns (partner flyers, intake promos).
 * @typedef {{
 *   institutionId: string,
 *   institutionName?: string,
 *   headline: string,
 *   tagline: string,
 *   spotlightDescription: string,
 *   intakeLabel: string,
 *   applyUrl?: string,
 *   offers?: string[],
 *   requirements?: string[],
 *   perks?: string[],
 *   faculties?: Array<{ name: string, tone: string, programmes: string[] }>,
 *   activeUntil?: string,
 * }} InstitutionCampaign
 */

/** @type {Record<string, InstitutionCampaign>} */
export const INSTITUTION_CAMPAIGNS = {
  limkokwing: {
    institutionId: "limkokwing",
    institutionName: "Limkokwing University of Creative Technology",
    headline: "Obtain employable skills through University TVET programmes",
    tagline: "Limkokwing University of Creative Technology · Botswana",
    spotlightDescription:
      "TVET degrees and diplomas across ICT, design, business, architecture, and media. July 2026 intake open — free laptop and smartphone for government-sponsored students.",
    intakeLabel: "Enrol now for July 2026 intake",
    applyUrl: "https://www.limkokwing.net/botswana/admissions",
    offers: [
      "Free laptop and smartphone for all government-sponsored students",
      "Special bursary assistance for private students",
      "Accommodation facilitation available",
    ],
    requirements: ["Certified copy of Omang or passport", "Results slip", "Certificates"],
    perks: ["Accommodation facilitation"],
    faculties: [
      {
        name: "Faculty of Information Communication Technology",
        tone: "teal",
        programmes: [
          "BSc in Software Engineering",
          "BSc in Information Technology Security",
          "BA in Creative Multimedia",
          "BSc in Information Systems",
          "Diploma in Information Technology",
        ],
      },
      {
        name: "Faculty of Design Innovation",
        tone: "purple",
        programmes: [
          "BA in Visual Communication",
          "BA in Industrial Design",
          "Diploma in Fashion Design",
          "Diploma in Graphic Design",
        ],
      },
      {
        name: "Faculty of Business and Globalisation",
        tone: "red",
        programmes: [
          "BBus in International Business",
          "BBus in Finance and Banking",
          "BBus in Tourism Management",
          "BBus in Hospitality Management",
        ],
      },
      {
        name: "Faculty of Architecture & the Built Environment",
        tone: "green",
        programmes: [
          "BA in Interior Architecture",
          "Associate Degree in Architectural Technology",
          "Certificate in Construction Management",
        ],
      },
      {
        name: "Faculty of Communication, Media & Broadcasting",
        tone: "orange",
        programmes: [
          "BA in Professional Communication",
          "BA in Digital Film and Television",
          "BA in Broadcasting and Journalism",
          "BA in Events Management",
        ],
      },
    ],
    activeUntil: "2026-08-10",
  },
};

/** @param {string | undefined | null} institutionId */
export function getInstitutionCampaign(institutionId) {
  if (!institutionId) return null;
  const campaign = INSTITUTION_CAMPAIGNS[institutionId];
  if (!campaign) return null;
  if (campaign.activeUntil) {
    const end = new Date(`${campaign.activeUntil}T23:59:59`);
    if (!Number.isNaN(end.getTime()) && end < new Date()) return null;
  }
  return campaign;
}
