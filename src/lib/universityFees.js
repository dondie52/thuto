/**
 * Faculty-level tuition fee schedules (per-credit and per-semester models).
 */

const ENGINEERING_RE = /\bengineering\b/i;
const MEDICINE_RE = /\b(medicine|mbbs|medical\s+school)\b/i;

/**
 * @param {number | null | undefined} amount
 * @param {string} [currency]
 */
export function formatFeeAmount(amount, currency = "BWP") {
  if (amount == null || !Number.isFinite(amount)) return null;
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

/**
 * @param {object} schedule
 * @param {object} group
 */
export function computeGroupEstimates(schedule, group) {
  if (!schedule || !group) return null;

  const currency = schedule.currency || "BWP";
  const semestersPerYear = schedule.semestersPerYear ?? 2;
  const normalSemesterCredits = schedule.normalSemesterCredits ?? null;

  if (schedule.basis === "per_semester" || schedule.basis === "per_programme") {
    const totalProgramme = group.totalProgramme ?? null;
    const durationYears = group.durationYears ?? null;
    const perYear =
      totalProgramme != null && durationYears != null && durationYears > 0
        ? totalProgramme / durationYears
        : null;
    const perSemester =
      perYear != null ? perYear / semestersPerYear : totalProgramme != null && durationYears != null
        ? totalProgramme / (durationYears * semestersPerYear)
        : null;

    return {
      currency,
      basis: schedule.basis,
      perCredit: null,
      perSemester,
      perYear,
      totalProgramme,
      totalCredits: null,
      normalSemesterCredits: null,
    };
  }

  const perCredit = group.perCredit ?? null;
  if (perCredit == null) return null;

  const perSemester =
    normalSemesterCredits != null ? perCredit * normalSemesterCredits : null;
  const creditsPerYear =
    normalSemesterCredits != null ? normalSemesterCredits * semestersPerYear : null;
  const perYear = creditsPerYear != null ? perCredit * creditsPerYear : null;

  let totalCredits = group.totalCredits ?? null;
  if (totalCredits == null && creditsPerYear != null && group.durationYears != null) {
    totalCredits = creditsPerYear * group.durationYears;
  }

  const totalProgramme = totalCredits != null ? perCredit * totalCredits : null;

  return {
    currency,
    basis: "per_credit",
    perCredit,
    perSemester,
    perYear,
    totalProgramme,
    totalCredits,
    normalSemesterCredits,
  };
}

/**
 * @param {string | null | undefined} value
 */
function normalizeToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ");
}

/**
 * @param {string} haystack
 * @param {string} needle
 */
function tokenMatches(haystack, needle) {
  const h = normalizeToken(haystack);
  const n = normalizeToken(needle);
  if (!h || !n) return false;
  return h.includes(n) || n.includes(h);
}

/**
 * @param {object} programme
 * @param {object} group
 */
function groupMatchesProgramme(programme, group) {
  const name = programme?.name || "";
  const faculty = programme?.faculty || "";
  const field = programme?.field || "";
  const haystacks = [name, faculty, field].filter(Boolean);

  if (ENGINEERING_RE.test(name) || ENGINEERING_RE.test(faculty)) {
    if (group.id === "engineering" || tokenMatches(group.name, "engineering")) return true;
    if (group.id === "science-engineering" || tokenMatches(group.name, "science")) return true;
  }

  if (MEDICINE_RE.test(name) || MEDICINE_RE.test(faculty)) {
    if (group.id === "medicine" || tokenMatches(group.name, "medicine")) return true;
  }

  for (const alias of group.aliases || []) {
    if (haystacks.some((h) => tokenMatches(h, alias))) return true;
  }
  for (const groupField of group.fields || []) {
    if (haystacks.some((h) => tokenMatches(h, groupField))) return true;
  }
  return false;
}

/**
 * @param {object | null | undefined} university
 * @param {object | null | undefined} programme
 */
export function lookupProgrammeFeeGroup(university, programme) {
  const schedule = university?.feeSchedule;
  if (!schedule?.groups?.length || !programme) return null;

  for (const group of schedule.groups) {
    if (groupMatchesProgramme(programme, group)) {
      return { schedule, group, estimates: computeGroupEstimates(schedule, group) };
    }
  }

  const fallback = schedule.groups.find((g) => g.id === "other-faculties" || g.id === "general");
  if (fallback) {
    return { schedule, group: fallback, estimates: computeGroupEstimates(schedule, fallback) };
  }

  return null;
}

/**
 * @param {object | null | undefined} university
 */
export function getUniversityFeeSchedule(university) {
  const schedule = university?.feeSchedule;
  if (!schedule?.groups?.length) return null;
  return {
    ...schedule,
    groups: schedule.groups.map((group) => ({
      ...group,
      estimates: computeGroupEstimates(schedule, group),
    })),
  };
}

/**
 * @param {object | null | undefined} programme
 * @param {object | null | undefined} university
 * @returns {{ text: string | null, value: number | null }}
 */
export function getProgrammeFeeCompareValue(programme, university) {
  const { source, fees, scheduleLookup } = resolveProgrammeFees(programme, university);
  if (source === "programme" && fees) {
    const text = `${fees.currency} ${fees.domestic.toLocaleString()}${fees.per ? ` / ${fees.per}` : ""}`;
    return { text, value: fees.domestic };
  }

  const estimates = scheduleLookup?.estimates;
  if (source === "schedule" && estimates) {
    if (estimates.totalProgramme != null) {
      return {
        text: `~${formatFeeAmount(estimates.totalProgramme, estimates.currency)} total (est.)`,
        value: estimates.totalProgramme,
      };
    }
    if (estimates.perSemester != null) {
      return {
        text: `~${formatFeeAmount(estimates.perSemester, estimates.currency)}/sem (est.)`,
        value: estimates.perSemester,
      };
    }
    if (estimates.perCredit != null) {
      return {
        text: `${formatFeeAmount(estimates.perCredit, estimates.currency)}/credit`,
        value: estimates.perCredit,
      };
    }
  }

  return { text: null, value: null };
}

/**
 * @param {object | null | undefined} programme
 * @param {object | null | undefined} university
 */
export function resolveProgrammeFees(programme, university) {
  const direct = programme?.fees;
  const hasDirect =
    direct &&
    typeof direct.domestic === "number" &&
    Number.isFinite(direct.domestic) &&
    direct.currency;

  if (hasDirect) {
    return {
      source: "programme",
      fees: direct,
      scheduleLookup: null,
    };
  }

  const scheduleLookup = lookupProgrammeFeeGroup(university, programme);
  if (!scheduleLookup?.estimates) {
    return { source: null, fees: null, scheduleLookup: null };
  }

  return {
    source: "schedule",
    fees: null,
    scheduleLookup,
  };
}
