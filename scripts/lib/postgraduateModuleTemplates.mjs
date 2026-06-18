/**
 * Programme-type module templates for postgraduate programmes where official
 * per-module lists are not published online. Used only when no modules exist yet.
 * Each template includes a modulesSource label for the merge report.
 */

/** @returns {{ semester: string|number, modules: string[] }[]} */
export function researchPhaseModules() {
  return [
    {
      semester: "Year 1",
      modules: ["Research proposal and literature review", "Confirmation of candidature"],
    },
    {
      semester: "Years 2–3",
      modules: ["Independent research under supervision", "Annual progress reviews and research seminars"],
    },
    {
      semester: "Final",
      modules: ["Thesis writing and submission", "Viva voce examination"],
    },
  ];
}

/** @returns {{ semester: string|number, modules: string[] }[]} */
export function mbaTemplate() {
  return [
    {
      semester: 1,
      modules: [
        "Organizational Theory and Behaviour",
        "Managerial Economics",
        "Management Accounting",
        "Marketing Strategy",
      ],
    },
    {
      semester: 2,
      modules: [
        "Financial Management",
        "Operations Management",
        "Business Research Methods",
        "Strategic Management",
      ],
    },
    {
      semester: 3,
      modules: ["Business Law", "Elective modules", "Business Presentation Skills"],
    },
    { semester: "Dissertation", modules: ["Research dissertation / project"] },
  ];
}

/** @returns {{ semester: string|number, modules: string[] }[]} */
export function medTemplate(specialization = "Education") {
  return [
    {
      semester: 1,
      modules: [
        "Educational Research Methods",
        "Curriculum Theory and Design",
        `Advanced ${specialization}`,
      ],
    },
    {
      semester: 2,
      modules: [
        "Assessment and Evaluation in Education",
        "Educational Leadership and Policy",
        "Elective in specialisation area",
      ],
    },
    { semester: "Dissertation", modules: ["Research dissertation in education"] },
  ];
}

/** @returns {{ semester: string|number, modules: string[] }[]} */
export function mscTemplate(field = "Science") {
  return [
    {
      semester: 1,
      modules: ["Research Methods", `Advanced ${field} Theory`, "Quantitative / Statistical Methods"],
    },
    {
      semester: 2,
      modules: [`Applied ${field}`, "Specialist elective modules"],
    },
    { semester: "Dissertation", modules: ["Research dissertation or thesis"] },
  ];
}

/** @returns {{ semester: string|number, modules: string[] }[]} */
export function maTemplate(field = "Arts") {
  return [
    {
      semester: 1,
      modules: ["Research Methods", `Theories in ${field}`, "Seminar in specialisation"],
    },
    {
      semester: 2,
      modules: ["Advanced topics in specialisation", "Elective modules"],
    },
    { semester: "Dissertation", modules: ["Research dissertation"] },
  ];
}

/** @returns {{ semester: string|number, modules: string[] }[]} */
export function pgdTemplate(field = "Business") {
  return [
    {
      semester: 1,
      modules: [`Foundations of ${field}`, "Research and Academic Writing", "Core specialisation modules"],
    },
    {
      semester: 2,
      modules: ["Applied professional practice", "Capstone / project work"],
    },
  ];
}

/** @returns {{ semester: string|number, modules: string[] }[]} */
export function pgcTemplate(field = "Professional Studies") {
  return [
    {
      semester: 1,
      modules: [`Introduction to ${field}`, "Professional practice module", "Applied skills workshop"],
    },
  ];
}

/** @returns {{ semester: string|number, modules: string[] }[]} */
export function mmedTemplate() {
  return [
    {
      semester: "Year 1",
      modules: [
        "Clinical rotations — foundation specialties",
        "Research methodology in clinical medicine",
        "MMed Part I examination preparation",
      ],
    },
    {
      semester: "Years 2–3",
      modules: ["Specialty clinical rotations", "Supervised clinical practice", "Research project"],
    },
    {
      semester: "Year 4",
      modules: ["Advanced specialty training", "MMed Part II examination", "Specialty registration preparation"],
    },
  ];
}

/** @returns {{ semester: string|number, modules: string[] }[]} */
export function bouEmbaModules() {
  return [
    {
      semester: "Year 1 — Semester 1",
      modules: [
        "BOM911 - Operations Management",
        "BHR911 - Managing Human Resources",
        "BMO911 - Management in Organisations",
        "BMI911 - Managing Information Systems",
      ],
    },
    {
      semester: "Year 1 — Semester 2 (choose 4)",
      modules: [
        "BQT921 - Quantitative Techniques",
        "BAF921 - Accounting and Finance",
        "BMM921 - Marketing Management",
        "SPS921 - Public Systems Management",
        "BEC921 - Economic Environment of Business",
      ],
    },
    {
      semester: "Year 2 — Semester 1",
      modules: [
        "BRM921 - Research Methods",
        "BQM921 - Quality Management",
        "BSM921 - Strategic Management",
      ],
    },
    {
      semester: "Year 2 — Semester 2",
      modules: [
        "BRM920 - Research Project",
        "Electives: International Marketing, Corporate Finance, Business Ethics, Disaster Management, Contemporary Administrative Systems, Project Management, Electronic Commerce",
      ],
    },
  ];
}

/** @returns {{ semester: string|number, modules: string[] }[]} */
export function bouEmpaModules() {
  return [
    {
      semester: "Core (Commonwealth executive programme)",
      modules: [
        "Management in Organisations",
        "Managing Human Resources",
        "Managing Information Systems",
        "Operations Management",
        "Research Methods",
        "Quality Management",
        "Strategic Management",
        "Public Systems Management",
        "Economic Environment of Public Administration",
      ],
    },
    {
      semester: "Year 2",
      modules: ["Research project in public administration", "Public administration electives"],
    },
  ];
}

/**
 * @param {{ id?: string, name?: string, field?: string, qualification?: string, tags?: string[] }} programme
 * @returns {{ modules: { semester: string|number, modules: string[] }[], modulesSource: string } | null}
 */
export function templateForProgramme(programme) {
  const name = String(programme.name || "").toLowerCase();
  const field = String(programme.field || "General");
  const id = String(programme.id || "");

  if (/mphil|phd|doctorate/.test(name)) {
    return { modules: researchPhaseModules(), modulesSource: "research_degree_template" };
  }
  if (id === "bou-executive-master-of-business-administration-emba") {
    return { modules: bouEmbaModules(), modulesSource: "bou.ac.bw/emba" };
  }
  if (id === "bou-executive-master-of-public-administration-empa") {
    return { modules: bouEmpaModules(), modulesSource: "bou.ac.bw/cempa_commonwealth" };
  }
  if (/mmed|master in medicine/.test(name)) {
    return { modules: mmedTemplate(), modulesSource: "ub_mmed_structure" };
  }
  if (/executive master|mba|master in business|master of business/.test(name)) {
    return { modules: mbaTemplate(), modulesSource: "mba_programme_type" };
  }
  if (/master of education|m\.?ed/.test(name)) {
    const spec = name.includes("early childhood")
      ? "Early Childhood Education"
      : name.includes("leadership")
        ? "Educational Leadership"
        : "Education";
    return { modules: medTemplate(spec), modulesSource: "med_programme_type" };
  }
  if (/master of science|m\.?sc/.test(name)) {
    return { modules: mscTemplate(field), modulesSource: "msc_programme_type" };
  }
  if (/master of arts|ma french|ma in|master of commerce/.test(name)) {
    return { modules: maTemplate(field), modulesSource: "ma_programme_type" };
  }
  if (/post.?grad.*diploma|pgd/.test(name)) {
    return { modules: pgdTemplate(field), modulesSource: "pgd_programme_type" };
  }
  if (/post.?grad.*certificate|pgc/.test(name)) {
    return { modules: pgcTemplate(field), modulesSource: "pgc_programme_type" };
  }
  if (/master of public|mpa|mrpp|development practice/.test(name)) {
    return { modules: maTemplate("Public Administration"), modulesSource: "mpa_programme_type" };
  }
  if (/master of laws|llm/.test(name)) {
    return {
      modules: [
        { semester: 1, modules: ["LAW702 - Advanced Legal Research Methods", "Specialisation electives"] },
        { semester: 2, modules: ["Dissertation in law"] },
      ],
      modulesSource: "ub_llm_partial",
    };
  }
  if (/master in social work|msw/.test(name)) {
    return { modules: mscTemplate("Social Work"), modulesSource: "msw_programme_type" };
  }
  if (/master in project|mpm/.test(name)) {
    return { modules: mscTemplate("Project Management"), modulesSource: "mpm_programme_type" };
  }
  if (/archives|library/.test(name)) {
    return { modules: maTemplate("Information Studies"), modulesSource: "lis_programme_type" };
  }
  return null;
}
