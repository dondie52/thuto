import { fetchUniversities } from "./universitiesData.js";
import { fetchActiveFeaturedPlacements, fetchVerifiedPartnersForMarketing } from "./partner.js";

const DEFAULT_FEATURED_IDS = ["ub", "biust", "buan", "botho", "bac", "bou", "limkokwing"];

/**
 * @param {string} placementKey
 */
function isHomePlacement(placementKey) {
  const key = String(placementKey || "").toLowerCase();
  return key === "home" || key.startsWith("home_");
}

/**
 * @param {string[]} fallbackIds
 * @returns {Promise<Array<{ university: object, sponsored: boolean, verified: boolean }>>}
 */
export async function fetchHomeFeaturedInstitutions(fallbackIds = DEFAULT_FEATURED_IDS) {
  const [placements, { list: universities }, verifiedPartners] = await Promise.all([
    fetchActiveFeaturedPlacements(),
    fetchUniversities(),
    fetchVerifiedPartnersForMarketing(),
  ]);

  const byId = new Map((universities || []).map((university) => [university.id, university]));
  const verifiedSet = new Set(verifiedPartners.map((row) => row.institutionId));
  const entries = [];
  const seen = new Set();

  function pushUniversity(id, { sponsored = false, verified = false } = {}) {
    if (!id || seen.has(id)) return;
    const university = byId.get(id);
    if (!university) return;
    seen.add(id);
    entries.push({
      university,
      sponsored: sponsored || verifiedSet.has(id),
      verified: verified || verifiedSet.has(id),
    });
  }

  for (const placement of placements) {
    if (placement.entity_type !== "institution" || !isHomePlacement(placement.placement_key)) continue;
    pushUniversity(placement.entity_id, { sponsored: true });
  }

  for (const placement of placements) {
    if (placement.entity_type !== "institution" || isHomePlacement(placement.placement_key)) continue;
    pushUniversity(placement.entity_id, { sponsored: true });
  }

  for (const partner of verifiedPartners) {
    pushUniversity(partner.institutionId, { sponsored: true, verified: true });
  }

  for (const university of universities || []) {
    if (university.featured) pushUniversity(university.id, { sponsored: false });
  }

  const ids = Array.isArray(fallbackIds) && fallbackIds.length ? fallbackIds : DEFAULT_FEATURED_IDS;
  for (const id of ids) {
    pushUniversity(id, { sponsored: false });
  }

  return entries.slice(0, 8);
}
