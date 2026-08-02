/**
 * Institution FAQs live on the institution override patch, so they need no table of their own.
 *
 * Institutions can answer any of the suggested questions below or write their own. Only
 * answered entries are published — a suggested question with no answer stays invisible to
 * students rather than showing an empty card.
 */

/** @typedef {{ question: string, answer: string }} InstitutionFaq */

export const SUGGESTED_FAQ_QUESTIONS = [
  "What are the minimum entry requirements?",
  "How do I apply, and what does it cost?",
  "When do applications open and close?",
  "What documents do I need to submit?",
  "Do you offer accommodation to first-year students?",
  "What are the tuition fees, and can I pay in instalments?",
  "Do you offer bursaries, scholarships, or sponsorship?",
  "Is the institution and its programmes accredited?",
  "Can I study part-time, in the evening, or online?",
  "Do you accept mature-entry or transfer students?",
  "What support is there for international students?",
  "How do I get my results or transcripts?",
];

/**
 * @param {unknown} value
 * @returns {InstitutionFaq[]}
 */
export function normalizeInstitutionFaqs(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const question = String(item.question || "").trim();
    if (!question) continue;
    const key = question.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ question, answer: String(item.answer || "").trim() });
  }
  return out;
}

/**
 * Only answered questions reach students.
 * @param {unknown} value
 * @returns {InstitutionFaq[]}
 */
export function publishedInstitutionFaqs(value) {
  return normalizeInstitutionFaqs(value).filter((faq) => faq.answer);
}

/**
 * Suggested questions the institution has not added yet.
 * @param {InstitutionFaq[]} faqs
 * @returns {string[]}
 */
export function unusedSuggestedQuestions(faqs) {
  const used = new Set(normalizeInstitutionFaqs(faqs).map((faq) => faq.question.toLowerCase()));
  return SUGGESTED_FAQ_QUESTIONS.filter((question) => !used.has(question.toLowerCase()));
}
