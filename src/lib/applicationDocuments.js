/** Standard documents students typically need when applying to Botswana tertiary institutions. */
export const APPLICATION_DOCUMENTS = [
  {
    id: "id",
    label: "Omang or valid national ID copy",
    note: "Certified copy may be required by some institutions.",
  },
  {
    id: "bgcse",
    label: "BGCSE certificate or statement of results",
    note: "Original or certified copy; some universities accept online verification.",
  },
  {
    id: "form",
    label: "Completed application form",
    note: "Usually from the institution website or admissions office.",
  },
  {
    id: "passport-photos",
    label: "Passport-size photographs",
    note: "Typically 2–4 recent photos.",
  },
  {
    id: "recommendation",
    label: "Recommendation or reference letter",
    note: "Often from a teacher, principal, or employer.",
  },
  {
    id: "motivation",
    label: "Motivation or personal statement",
    note: "Required for some competitive programmes.",
  },
  {
    id: "fees",
    label: "Application fee proof (if applicable)",
    note: "Bank deposit slip or online payment confirmation.",
  },
  {
    id: "sponsorship",
    label: "Sponsorship or DTEF documents (if applicable)",
    note: "Government sponsorship forms and supporting affidavits.",
  },
];

/**
 * @param {import('./programmesData.js').Programme | null | undefined} programme
 */
export function getApplicationDocuments(programme) {
  const extra = [];
  const university = String(programme?.university || "").toLowerCase();
  if (university.includes("university of botswana") || university === "ub") {
    extra.push({
      id: "ub-medical",
      label: "Medical examination form",
      note: "Required for some health-related programmes at UB.",
    });
  }
  return [...APPLICATION_DOCUMENTS, ...extra];
}
