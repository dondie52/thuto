/**
 * Shared constructors for grading profiles.
 *
 * Encoding ~27 national scales by hand produces a lot of near-identical tables, so the shapes
 * that repeat (Cambridge letter ladders, ascending and descending numeric scales, and
 * continuous /20 or percentage scales) are built from a description instead of typed out.
 */

/**
 * Canonical ordinal ladder, weakest first.
 *
 * Programme entry requirements in `public/data/programmes.json` are written as BGCSE letters
 * ("english": "C"). A student on an NSC achievement level or an ECZ numeric grade can only be
 * compared against that ordinally — comparing raw points is what silently fails today, because
 * an ECZ 3 is a strong pass while a BGCSE 3 is an F.
 *
 * @typedef {'U'|'G'|'F'|'E'|'D'|'C'|'B'|'A'|'A*'} CanonicalBand
 */
export const CANONICAL_BANDS = /** @type {CanonicalBand[]} */ (["U", "G", "F", "E", "D", "C", "B", "A", "A*"]);

/**
 * @param {string | null | undefined} band
 * @returns {number} index in CANONICAL_BANDS, or -1
 */
export function bandRank(band) {
  return CANONICAL_BANDS.indexOf(/** @type {CanonicalBand} */ (String(band || "").trim().toUpperCase()));
}

/**
 * @typedef {{ value: string, label?: string, points: number, band: CanonicalBand }} GradeOption
 */

/** Cambridge-family A*–G ladder, where the native token is already a canonical band. */
export function letterLadder(pointsByLetter) {
  return Object.entries(pointsByLetter).map(([value, points]) => ({
    value,
    points,
    band: /** @type {CanonicalBand} */ (value),
  }));
}

/**
 * Higher number is better (NSC levels 1-7, UACE 0-6).
 * @param {{ from: number, to: number, bands: Record<number, CanonicalBand>, labels?: Record<number, string> }} spec
 * @returns {GradeOption[]}
 */
export function ascendingNumeric({ from, to, bands, labels = {} }) {
  const out = [];
  for (let n = to; n >= from; n -= 1) {
    out.push({ value: String(n), label: labels[n], points: n, band: bands[n] || "U" });
  }
  return out;
}

/**
 * Lower number is better (ECZ 1-9, WASSCE A1-F9, MSCE 1-9). Points stay the native number so
 * the aggregate a student recognises ("aggregate 12") is the one Thuto shows back to them;
 * `direction: 'lower_better'` on the profile tells the scorer how to read it.
 *
 * @param {{ from: number, to: number, bands: Record<number, CanonicalBand>, labels?: Record<number, string>, values?: Record<number, string> }} spec
 * @returns {GradeOption[]}
 */
export function descendingNumeric({ from, to, bands, labels = {}, values = {} }) {
  const out = [];
  for (let n = from; n <= to; n += 1) {
    out.push({ value: values[n] || String(n), label: labels[n], points: n, band: bands[n] || "U" });
  }
  return out;
}

/**
 * A continuous scale (a /20 moyenne, a percentage) bucketed into the bands a student would
 * recognise from their own transcript.
 *
 * @param {{ value: number, label: string, band: CanonicalBand }[]} bands
 * @returns {GradeOption[]}
 */
export function bandedScale(bands) {
  return bands.map(({ value, label, band }) => ({ value: String(value), label, points: value, band }));
}

/**
 * Fills in the derived fields every profile needs so each definition only states what is
 * genuinely specific to that syllabus.
 *
 * @param {Record<string, any>} spec
 * @returns {Record<string, any>}
 */
export function defineProfile(spec) {
  const grades = spec.grades || [];
  const points = grades.map((g) => g.points);
  const direction = spec.direction || "higher_better";
  const subjectsCounted = spec.subjectsCounted ?? 6;

  const minPerSubject = spec.minPerSubject ?? Math.min(...points);
  const maxPerSubject = spec.maxPerSubject ?? Math.max(...points);

  // Best and worst attainable aggregates, so a result can be placed on a 0-100 index.
  const best = direction === "lower_better" ? minPerSubject : maxPerSubject;
  const worst = direction === "lower_better" ? maxPerSubject : minPerSubject;

  return {
    ...spec,
    grades,
    direction,
    subjectsCounted,
    minPerSubject,
    maxPerSubject,
    aggregateBest: spec.aggregateBest ?? best * subjectsCounted,
    aggregateWorst: spec.aggregateWorst ?? worst * subjectsCounted,
    level: spec.level || "secondary",
    verified: Boolean(spec.verified),
    sourceNote: spec.sourceNote || "",
    aliases: spec.aliases || [],
    examBoards: spec.examBoards || ["bgcse", "igcse"],
    allowsScienceDouble: Boolean(spec.allowsScienceDouble),
    // Legacy shape: several call sites still read `gradePoints` as a plain map.
    gradePoints: Object.fromEntries(grades.map((g) => [g.value, g.points])),
    bandByGrade: Object.fromEntries(grades.map((g) => [g.value, g.band])),
  };
}
