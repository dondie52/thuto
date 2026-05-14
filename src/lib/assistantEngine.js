import { formatDisplayDate } from "./applicationDates.js";
import { evaluateProgramme, programmeHasAdmissionPoints } from "./admissions.js";
import { buildProgrammeFitExplanation, normalizeText, rankProgrammeMatches } from "./fitFinder.js";

const MAX_RESULTS = 5;

export function getProviderStatus() {
  const enabled = String(import.meta.env.VITE_AI_ENABLED || "").toLowerCase() === "true";
  const provider = String(import.meta.env.VITE_AI_PROVIDER || "").trim();
  return {
    enabled,
    provider,
    configured: Boolean(enabled && provider),
    label: enabled && provider ? `${provider} ready for a server-side integration` : "AI mode not configured yet",
    note:
      enabled && provider
        ? "This build still answers locally. Future AI calls should go through a server or serverless function."
        : "Local mode is active and works offline after data is cached.",
  };
}

function programmeHaystack(programme) {
  return normalizeText(
    [
      programme.name,
      programme.university,
      programme.field,
      programme.faculty,
      programme.description,
      (programme.careers || []).join(" "),
      (programme.careerOpportunities || []).join(" "),
      (programme.modules || []).flatMap((block) => block?.modules || []).join(" "),
      (programme.interests || []).join(" "),
      (programme.relatedSubjects || []).join(" "),
      (programme.tags || []).join(" "),
    ].join(" "),
  );
}

function findProgrammeMatches(question, programmes) {
  const q = normalizeText(question);
  if (!q) return [];
  const words = q.split(" ").filter((w) => w.length > 2);
  return programmes
    .map((programme) => {
      const text = programmeHaystack(programme);
      const exactName = text.includes(normalizeText(programme.name)) && q.includes(normalizeText(programme.name));
      const score = words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), exactName ? 10 : 0);
      return { programme, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.programme.name.localeCompare(b.programme.name))
    .slice(0, MAX_RESULTS)
    .map((row) => row.programme);
}

function findUniversityMatches(question, universities) {
  const q = normalizeText(question);
  return universities
    .filter((u) => normalizeText([u.name, u.location, u.description].join(" ")).split(" ").some((word) => q.includes(word)))
    .slice(0, MAX_RESULTS);
}

function hasAny(question, terms) {
  const q = normalizeText(question);
  return terms.some((term) => q.includes(normalizeText(term)));
}

function applicationLineForUniversity(university) {
  const open = university.applicationOpen ? formatDisplayDate(university.applicationOpen) : null;
  const close = university.applicationClose ? formatDisplayDate(university.applicationClose) : null;
  if (open && close) return `${university.name}: applications listed from ${open} to ${close}.`;
  if (close) return `${university.name}: application close listed as ${close}.`;
  return `${university.name}: application dates are not listed in Thuto.`;
}

function programmeSummary(programme, predictorSnap) {
  const bits = [];
  bits.push(programme.university || "Institution not listed");
  if (programme.field) bits.push(programme.field);
  bits.push(programmeHasAdmissionPoints(programme) ? `min ${programme.minPoints} pts` : "min points not listed");
  if (predictorSnap?.grades && predictorSnap?.total != null) {
    const admission = evaluateProgramme(programme, predictorSnap.grades, predictorSnap.total);
    bits.push(admission.status === "Unknown" ? "admission unverified" : admission.status.toLowerCase());
  }
  return bits.join(" · ");
}

export function buildProgrammeFitExplanationForAssistant(match) {
  return buildProgrammeFitExplanation(match);
}

export function buildLocalAssistantReply({ question, programmes = [], universities = [], predictorSnap = null }) {
  const q = String(question || "").trim();
  if (!q) {
    return {
      title: "Ask about programmes, universities, requirements, careers, modules, or fit.",
      answer: "I use the bundled Thuto data first, so I can still help when you are offline.",
      items: [],
      suggestions: ["What can I study with my grades?", "Which technology programmes are available?", "When do applications close?"],
    };
  }

  if (hasAny(q, ["what can i study", "my grades", "qualify", "eligible", "fit me", "fits me", "recommend"])) {
    if (!predictorSnap?.grades || predictorSnap.total == null) {
      return {
        title: "I need saved grades for that.",
        answer:
          "Use the Predictor or Fit Finder to enter your BGCSE subjects and grades first. Then I can rank programmes locally using the sample admission rules.",
        items: [],
        suggestions: ["Open Fit Finder", "Open Predictor"],
      };
    }
    const matches = rankProgrammeMatches(programmes, {
      requirementGrades: predictorSnap.grades,
      bestSixTotal: predictorSnap.total,
      interests: q,
      careerArea: q,
      strengths: q,
    }, { limit: MAX_RESULTS });
    return {
      title: "Local programme matches from your saved grades",
      answer: `Your saved best-six total is ${predictorSnap.total}. These matches use Thuto's sample rules and local scoring, not official admission decisions.`,
      items: matches.map((match) => ({
        heading: `${match.programme.name} (${match.fitScore}% fit)`,
        body: `${match.programme.university} · ${match.admission.status}. ${match.why[0] || "Matched from local programme data."}`,
        href: `/programmes/${match.programme.id}`,
      })),
      suggestions: ["Compare these in Fit Finder", "Check subject requirements", "Show application dates"],
    };
  }

  if (hasAny(q, ["application", "apply", "deadline", "dates", "closing", "close"])) {
    const uniMatches = findUniversityMatches(q, universities);
    const list = uniMatches.length ? uniMatches : universities.slice(0, MAX_RESULTS);
    return {
      title: "Application dates in bundled data",
      answer: "These are the dates currently stored in Thuto. Always verify with the institution before applying.",
      items: list.map((u) => ({
        heading: u.name,
        body: applicationLineForUniversity(u),
        href: u.applyUrl || u.website || "",
        external: Boolean(u.applyUrl || u.website),
      })),
      suggestions: ["Which universities are open?", "Show programmes at UB", "How do I apply?"],
    };
  }

  if (hasAny(q, ["universities", "institutions", "schools"]) && !hasAny(q, ["programme", "programmes"])) {
    return {
      title: "Universities in Thuto",
      answer: "These institution records are bundled locally. Application dates and links appear when they are listed.",
      items: universities.slice(0, MAX_RESULTS).map((u) => ({
        heading: u.name,
        body: [u.location, applicationLineForUniversity(u)].filter(Boolean).join(" · "),
        href: `/universities/${u.id}`,
      })),
      suggestions: ["Show application dates", "Show programmes", "Which universities are open?"],
    };
  }

  if (hasAny(q, ["modules", "module", "course content"]) && hasAny(q, ["programme", "programmes", "courses"])) {
    const withModules = programmes.filter((programme) => programme.modules?.length).slice(0, MAX_RESULTS);
    return {
      title: "Programmes with modules listed",
      answer: "These programmes have module samples in the bundled data.",
      items: withModules.map((programme) => ({
        heading: programme.name,
        body: `${programme.university} · ${(programme.modules || []).flatMap((block) => block?.modules || []).slice(0, 2).join("; ")}`,
        href: `/programmes/${programme.id}`,
      })),
      suggestions: ["Show technology modules", "Show careers", "Open Fit Finder"],
    };
  }

  if (hasAny(q, ["career", "careers", "jobs"]) && hasAny(q, ["programme", "programmes", "courses"])) {
    const withCareers = programmes.filter((programme) => programme.careers?.length || programme.careerOpportunities?.length).slice(0, MAX_RESULTS);
    return {
      title: "Programmes with career examples",
      answer: "These career examples come from the local programme records.",
      items: withCareers.map((programme) => {
        const careers = programme.careerOpportunities?.length ? programme.careerOpportunities : programme.careers;
        return {
          heading: programme.name,
          body: `${programme.university} · ${careers.slice(0, 4).join(", ")}`,
          href: `/programmes/${programme.id}`,
        };
      }),
      suggestions: ["Which programme fits me?", "Show modules", "Open Fit Finder"],
    };
  }

  const programmeMatches = findProgrammeMatches(q, programmes);
  if (programmeMatches.length) {
    const wantsModules = hasAny(q, ["module", "course content", "subjects"]);
    const wantsCareers = hasAny(q, ["career", "job", "work"]);
    const wantsRequirements = hasAny(q, ["requirement", "points", "grade", "admission"]);
    return {
      title: "Programme information from local data",
      answer: "I found these programme records in Thuto. Missing fields mean the source data has not been added yet.",
      items: programmeMatches.map((programme) => {
        let body = programmeSummary(programme, predictorSnap);
        if (wantsModules) {
          const firstModules = (programme.modules || []).flatMap((block) => block?.modules || []).slice(0, 3);
          body = firstModules.length ? `Sample modules: ${firstModules.join("; ")}` : "Modules are not listed in Thuto yet.";
        } else if (wantsCareers) {
          const careers = programme.careerOpportunities?.length ? programme.careerOpportunities : programme.careers;
          body = careers?.length ? `Related careers: ${careers.slice(0, 4).join(", ")}.` : "Career examples are not listed in Thuto yet.";
        } else if (wantsRequirements) {
          const reqs = Object.entries(programme.subjectRequirements || {});
          body = `${programmeHasAdmissionPoints(programme) ? `Minimum points: ${programme.minPoints}. ` : "Minimum points are not listed. "}${
            reqs.length ? `Subject requirements: ${reqs.map(([k, v]) => `${k} ${v}`).join(", ")}.` : "No subject-specific rules are listed."
          }`;
        }
        return {
          heading: programme.name,
          body,
          href: `/programmes/${programme.id}`,
        };
      }),
      suggestions: ["Check Fit Finder", "Show related careers", "Show modules"],
    };
  }

  const universityMatches = findUniversityMatches(q, universities);
  if (universityMatches.length) {
    return {
      title: "University information from local data",
      answer: "I found matching university records in Thuto.",
      items: universityMatches.map((u) => ({
        heading: u.name,
        body: [u.location, u.description, applicationLineForUniversity(u)].filter(Boolean).join(" "),
        href: `/universities/${u.id}`,
      })),
      suggestions: ["Show application dates", "Show programmes", "Open Fit Finder"],
    };
  }

  return {
    title: "I could not find that in the bundled data.",
    answer:
      "Try asking with a programme name, university name, field, career, module, application date, or your saved grades. I will avoid guessing when the data is missing.",
    items: [],
    suggestions: ["What can I study with my grades?", "Show business programmes", "When do applications close?"],
  };
}

export { buildProgrammeFitExplanation };
