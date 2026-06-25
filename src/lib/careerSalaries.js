/** Indicative monthly salary ranges (BWP) for careers common in Botswana tertiary programmes. */
const SALARY_BANDS = [
  { pattern: /engineer|engineering|technician|mechanic|electrician/i, label: "P8,000–P18,000/month" },
  { pattern: /nurse|nursing|midwife|health|medical|pharmacy|clinical/i, label: "P7,500–P16,000/month" },
  { pattern: /teacher|teaching|education|lecturer|tutor/i, label: "P6,500–P14,000/month" },
  { pattern: /accountant|accounting|finance|auditor|bank/i, label: "P8,000–P20,000/month" },
  { pattern: /lawyer|legal|attorney|paralegal/i, label: "P9,000–P22,000/month" },
  { pattern: /developer|software|programmer|data|analyst|it |information technology/i, label: "P9,000–P25,000/month" },
  { pattern: /manager|management|business|marketing|sales|entrepreneur/i, label: "P7,000–P18,000/month" },
  { pattern: /social work|community|counsell/i, label: "P5,500–P12,000/month" },
  { pattern: /agricultur|farm|horticultur/i, label: "P5,000–P11,000/month" },
  { pattern: /journalist|media|communication|public relations/i, label: "P6,000–P14,000/month" },
];

const DEFAULT_BAND = "P5,500–P15,000/month";

/**
 * @param {string} career
 * @returns {string}
 */
export function getCareerSalaryEstimate(career) {
  const text = String(career || "").trim();
  if (!text) return DEFAULT_BAND;
  for (const band of SALARY_BANDS) {
    if (band.pattern.test(text)) return band.label;
  }
  return DEFAULT_BAND;
}
