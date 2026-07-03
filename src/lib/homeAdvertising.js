import { fetchUniversities } from "./universitiesData.js";
import { fetchProgrammes } from "./programmesData.js";
import { fetchActiveFeaturedPlacements, fetchVerifiedPartnersForMarketing } from "./partner.js";
import { hash32, localCalendarDateKey, pickDistinctBySeed, programmeEligibleForSpotlight } from "./weeklyHomeSpotlight.js";

const DEFAULT_FEATURED_IDS = ["ub", "biust", "buan", "botho", "bac", "bou", "limkokwing"];
const DAILY_SPOTLIGHT_FALLBACK_IDS = DEFAULT_FEATURED_IDS;
const DAILY_INSTITUTION_SPOTLIGHT_LIMIT = 5;
const DAILY_PROGRAMME_SPOTLIGHT_LIMIT = 10;
const DAILY_PROGRAMME_SPOTLIGHT_FALLBACK_IDS = [
  "ub-bachelor-arts-economics",
  "biust-bsc-computer-science",
  "botho-bsc-data-science",
  "bou-bachelor-of-business-administration-leadership-and-change-management-bba",
  "buan-bachelor-of-science-in-agriculture",
  "bac-bcom-accounting",
  "limkokwing-ba-graphic",
];

/** @type {Record<string, number>} */
const TIER_PRIORITY = {
  growth: 4,
  spotlight: 3,
  insights: 2,
  verified: 1,
};

/**
 * @param {string} placementKey
 */
function isHomeHeroPlacement(placementKey) {
  return String(placementKey || "").toLowerCase() === "home_hero";
}

/**
 * @param {string} placementKey
 */
function isHomeDailyPlacement(placementKey) {
  const key = String(placementKey || "").toLowerCase();
  return key === "home_daily" || key.startsWith("home_daily_");
}

/**
 * @param {string} placementKey
 */
function isHomeListPlacement(placementKey) {
  const key = String(placementKey || "").toLowerCase();
  return key === "home" || (key.startsWith("home_") && key !== "home_hero" && !isHomeDailyPlacement(key));
}

/**
 * @param {string | undefined | null} tier
 */
function tierPriority(tier) {
  return TIER_PRIORITY[String(tier || "").toLowerCase()] ?? 0;
}

/**
 * @param {string | undefined | null} tier
 */
function isPremiumTier(tier) {
  const key = String(tier || "").toLowerCase();
  return key === "growth" || key === "spotlight";
}

/**
 * @typedef {{ university: object, sponsored: boolean, verified: boolean, tier: string | null, premium: boolean }} HomeInstitutionEntry
 */

/**
 * @typedef {{ programme: object, sponsored: boolean, teaser?: string }} HomeProgrammeEntry
 */

/**
 * @returns {Promise<{ placements: object[], universities: object[], verifiedPartners: object[], byId: Map<string, object>, partnerTierById: Map<string, string>, verifiedSet: Set<string> }>}
 */
async function loadHomeAdvertisingContext() {
  const [placements, { list: universities }, verifiedPartners] = await Promise.all([
    fetchActiveFeaturedPlacements(),
    fetchUniversities(),
    fetchVerifiedPartnersForMarketing(),
  ]);

  return {
    placements,
    universities: universities || [],
    verifiedPartners,
    byId: new Map((universities || []).map((university) => [university.id, university])),
    partnerTierById: new Map(verifiedPartners.map((row) => [row.institutionId, row.tier])),
    verifiedSet: new Set(verifiedPartners.map((row) => row.institutionId)),
  };
}

/**
 * @param {HomeInstitutionEntry[]} entries
 * @param {string} dayKey
 */
function orderEntriesForDay(entries, dayKey) {
  return [...entries].sort((a, b) => {
    const hashA = hash32(`${dayKey}|daily-spotlight|${a.university.id}`);
    const hashB = hash32(`${dayKey}|daily-spotlight|${b.university.id}`);
    return hashA - hashB;
  });
}

/**
 * @param {HomeProgrammeEntry[]} entries
 * @param {string} dayKey
 */
function orderProgrammeEntriesForDay(entries, dayKey) {
  return [...entries].sort((a, b) => {
    const hashA = hash32(`${dayKey}|daily-programme-spotlight|${a.programme.id}`);
    const hashB = hash32(`${dayKey}|daily-programme-spotlight|${b.programme.id}`);
    return hashA - hashB;
  });
}

/**
 * @returns {Promise<{ placements: object[], programmes: object[], byId: Map<string, object> }>}
 */
async function loadProgrammesAdvertisingContext() {
  const [placements, programmes] = await Promise.all([fetchActiveFeaturedPlacements(), fetchProgrammes()]);

  return {
    placements,
    programmes: programmes || [],
    byId: new Map((programmes || []).map((programme) => [programme.id, programme])),
  };
}

/**
 * @returns {Promise<HomeInstitutionEntry | null>}
 */
export async function fetchHomeHeroPartner() {
  const { placements, byId, partnerTierById, verifiedSet } = await loadHomeAdvertisingContext();

  const heroPlacements = placements.filter(
    (placement) => placement.entity_type === "institution" && isHomeHeroPlacement(placement.placement_key),
  );

  for (const placement of heroPlacements) {
    const university = byId.get(placement.entity_id);
    if (!university) continue;
    const partnerTier = partnerTierById.get(placement.entity_id) || null;
    const tier = placement.tier || partnerTier;
    return {
      university,
      sponsored: true,
      verified: verifiedSet.has(placement.entity_id),
      tier,
      premium: isPremiumTier(tier),
    };
  }

  return null;
}

/**
 * Daily rotating spotlight pool for the home slideshow.
 * @param {{ excludeIds?: string[], fallbackIds?: string[] }} [options]
 * @returns {Promise<{ dayKey: string, entries: HomeInstitutionEntry[] }>}
 */
export async function fetchDailySpotlightInstitutions(options = {}) {
  const excludeIds = new Set(options.excludeIds || []);
  const fallbackIds =
    Array.isArray(options.fallbackIds) && options.fallbackIds.length ? options.fallbackIds : DAILY_SPOTLIGHT_FALLBACK_IDS;
  const dayKey = localCalendarDateKey();
  const { placements, universities, verifiedPartners, byId, partnerTierById, verifiedSet } =
    await loadHomeAdvertisingContext();

  /** @type {HomeInstitutionEntry[]} */
  const entries = [];
  const seen = new Set();

  /**
   * @param {string} id
   * @param {{ sponsored?: boolean, verified?: boolean, tier?: string | null, daily?: boolean }} meta
   */
  function pushUniversity(id, { sponsored = false, verified = false, tier = null, daily = false } = {}) {
    if (!id || seen.has(id) || excludeIds.has(id)) return;
    const university = byId.get(id);
    if (!university) return;

    const partnerTier = partnerTierById.get(id) || null;
    const resolvedTier = tier || partnerTier;
    const premium = isPremiumTier(resolvedTier);
    const isSponsored = sponsored || verifiedSet.has(id);
    const eligible = daily || premium || isSponsored;

    if (!eligible) return;

    seen.add(id);
    entries.push({
      university,
      sponsored: isSponsored,
      verified: verified || verifiedSet.has(id),
      tier: resolvedTier,
      premium,
    });
  }

  for (const placement of placements) {
    if (placement.entity_type !== "institution" || isHomeHeroPlacement(placement.placement_key)) continue;
    pushUniversity(placement.entity_id, {
      sponsored: true,
      tier: placement.tier || null,
      daily: isHomeDailyPlacement(placement.placement_key),
    });
  }

  for (const partner of verifiedPartners) {
    if (isPremiumTier(partner.tier)) {
      pushUniversity(partner.institutionId, {
        sponsored: true,
        verified: true,
        tier: partner.tier,
      });
    }
  }

  if (entries.length === 0) {
    for (const id of fallbackIds) {
      const university = byId.get(id);
      if (!university || seen.has(id) || excludeIds.has(id)) continue;
      seen.add(id);
      entries.push({
        university,
        sponsored: false,
        verified: verifiedSet.has(id),
        tier: partnerTierById.get(id) || null,
        premium: false,
      });
    }
    for (const university of universities) {
      if (!university.featured || seen.has(university.id) || excludeIds.has(university.id)) continue;
      seen.add(university.id);
      entries.push({
        university,
        sponsored: false,
        verified: verifiedSet.has(university.id),
        tier: partnerTierById.get(university.id) || null,
        premium: false,
      });
    }
  }

  return {
    dayKey,
    entries: orderEntriesForDay(entries, dayKey).slice(0, DAILY_INSTITUTION_SPOTLIGHT_LIMIT),
  };
}

/**
 * Daily rotating spotlight pool for programmes on the home slideshow.
 * @param {{ excludeIds?: string[], fallbackIds?: string[] }} [options]
 * @returns {Promise<{ dayKey: string, entries: HomeProgrammeEntry[] }>}
 */
export async function fetchDailySpotlightProgrammes(options = {}) {
  const excludeIds = new Set(options.excludeIds || []);
  const fallbackIds =
    Array.isArray(options.fallbackIds) && options.fallbackIds.length
      ? options.fallbackIds
      : DAILY_PROGRAMME_SPOTLIGHT_FALLBACK_IDS;
  const dayKey = localCalendarDateKey();
  const { placements, programmes, byId } = await loadProgrammesAdvertisingContext();

  /** @type {HomeProgrammeEntry[]} */
  const entries = [];
  const seen = new Set();

  /**
   * @param {string} id
   * @param {{ sponsored?: boolean, teaser?: string }} [meta]
   */
  function pushProgramme(id, { sponsored = false, teaser } = {}) {
    if (!id || seen.has(id) || excludeIds.has(id)) return;
    const programme = byId.get(id);
    if (!programme) return;

    seen.add(id);
    entries.push({
      programme,
      sponsored,
      teaser,
    });
  }

  for (const placement of placements) {
    if (placement.entity_type !== "programme" || !isHomeDailyPlacement(placement.placement_key)) continue;
    pushProgramme(placement.entity_id, { sponsored: true });
  }

  if (entries.length === 0) {
    for (const id of fallbackIds) {
      pushProgramme(id, { sponsored: false });
    }
    const eligible = programmes.filter(
      (programme) =>
        programmeEligibleForSpotlight(programme) && !seen.has(programme.id) && !excludeIds.has(programme.id),
    );
    const remaining = Math.max(0, DAILY_PROGRAMME_SPOTLIGHT_LIMIT - entries.length);
    const picks = pickDistinctBySeed(eligible, remaining, `${dayKey}|daily-programme-spotlight-picks`);
    for (const programme of picks) {
      pushProgramme(programme.id, { sponsored: false });
    }
  }

  return {
    dayKey,
    entries: orderProgrammeEntriesForDay(entries, dayKey).slice(0, DAILY_PROGRAMME_SPOTLIGHT_LIMIT),
  };
}

/**
 * @param {string[]} fallbackIds
 * @param {{ excludeIds?: string[] }} [options]
 * @returns {Promise<HomeInstitutionEntry[]>}
 */
export async function fetchHomeFeaturedInstitutions(fallbackIds = DEFAULT_FEATURED_IDS, options = {}) {
  const excludeIds = new Set(options.excludeIds || []);
  const { placements, universities, verifiedPartners, byId, partnerTierById, verifiedSet } =
    await loadHomeAdvertisingContext();

  /** @type {HomeInstitutionEntry[]} */
  const entries = [];
  const seen = new Set();

  let hasPaidPlacement = false;

  /**
   * @param {string} id
   * @param {{ sponsored?: boolean, verified?: boolean, tier?: string | null }} meta
   */
  function pushUniversity(id, { sponsored = false, verified = false, tier = null } = {}) {
    if (!id || seen.has(id) || excludeIds.has(id)) return;
    const university = byId.get(id);
    if (!university) return;
    seen.add(id);
    const partnerTier = partnerTierById.get(id) || null;
    const resolvedTier = tier || partnerTier;
    const isSponsored = sponsored || verifiedSet.has(id);
    if (isSponsored && (sponsored || isPremiumTier(resolvedTier))) {
      hasPaidPlacement = true;
    }
    entries.push({
      university,
      sponsored: isSponsored,
      verified: verified || verifiedSet.has(id),
      tier: resolvedTier,
      premium: isPremiumTier(resolvedTier),
    });
  }

  for (const placement of placements) {
    if (placement.entity_type !== "institution" || !isHomeListPlacement(placement.placement_key)) continue;
    pushUniversity(placement.entity_id, { sponsored: true, tier: placement.tier || null });
  }

  for (const placement of placements) {
    if (
      placement.entity_type !== "institution" ||
      isHomeListPlacement(placement.placement_key) ||
      isHomeHeroPlacement(placement.placement_key) ||
      isHomeDailyPlacement(placement.placement_key)
    ) {
      continue;
    }
    pushUniversity(placement.entity_id, { sponsored: true, tier: placement.tier || null });
  }

  for (const partner of verifiedPartners) {
    pushUniversity(partner.institutionId, {
      sponsored: true,
      verified: true,
      tier: partner.tier,
    });
  }

  for (const university of universities || []) {
    if (university.featured) pushUniversity(university.id, { sponsored: false });
  }

  if (!hasPaidPlacement) {
    const ids = Array.isArray(fallbackIds) && fallbackIds.length ? fallbackIds : DEFAULT_FEATURED_IDS;
    for (const id of ids) {
      pushUniversity(id, { sponsored: false });
    }
  }

  entries.sort((a, b) => {
    if (a.sponsored !== b.sponsored) return a.sponsored ? -1 : 1;
    const tierDiff = tierPriority(b.tier) - tierPriority(a.tier);
    if (tierDiff !== 0) return tierDiff;
    return a.university.name.localeCompare(b.university.name);
  });

  return entries.slice(0, 8);
}
