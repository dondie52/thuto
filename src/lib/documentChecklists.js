const BASE_CHECKLIST = [
  { id: "id", label: "National ID (Omang) or passport copy", required: true },
  { id: "certificates", label: "Certified BGCSE result slips or statement of results", required: true },
  { id: "application", label: "Completed application form (online or paper as required)", required: true },
  { id: "fees", label: "Application fee payment proof (if applicable)", required: false },
  { id: "recommendation", label: "Recommendation or reference letter", required: false },
  { id: "motivation", label: "Motivation letter or personal statement", required: false },
  { id: "portfolio", label: "Portfolio or audition materials (creative programmes)", required: false },
];

/**
 * @param {import('./programmesData.js').Programme | null | undefined} programme
 */
export function getDocumentsChecklist(programme) {
  const extras = [];
  const field = String(programme?.field || "").toLowerCase();
  const name = String(programme?.name || "").toLowerCase();

  if (field.includes("health") || name.includes("nursing") || name.includes("medicine")) {
    extras.push({ id: "health", label: "Medical examination / immunisation records", required: false });
  }
  if (field.includes("law") || name.includes("law")) {
    extras.push({ id: "police", label: "Police clearance certificate", required: false });
  }

  return [...BASE_CHECKLIST, ...extras];
}
