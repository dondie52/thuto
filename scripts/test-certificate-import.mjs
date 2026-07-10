import {
  assessImportedDocument,
  parseRowsFromText,
} from "../src/lib/certificateImport.js";

const RECEIPT_TEXT = `
Receipt Details
Merchant Example Store
Payment received
Invoice #12345
VAT 14%
Total 250.00 BWP
Thank you for your purchase
`;

const CERTIFICATE_TEXT = `
Botswana Examinations Council
BGCSE Statement of Results
Certificate of Examination
Candidate Number 123456
English Language A
Mathematics B
Biology C
Setswana B
Science Double Award CC
Physical Education D
`;

const DOUBLE_AWARD_TEXT = `
BGCSE Statement of Results
Science Double Award CC
English Language A
`;

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
}

const receiptAssessment = assessImportedDocument(RECEIPT_TEXT);
assert(receiptAssessment.looksLikeCertificate === false, "receipt text is not classified as certificate");
assert(receiptAssessment.negative > 0, "receipt text triggers negative signals");

const receiptRows = parseRowsFromText(RECEIPT_TEXT);
assert(receiptRows.length === 0, "receipt text produces zero auto-import rows");

const certificateAssessment = assessImportedDocument(CERTIFICATE_TEXT);
assert(certificateAssessment.looksLikeCertificate === true, "certificate text is classified as certificate");

const certificateRows = parseRowsFromText(CERTIFICATE_TEXT);
assert(certificateRows.length >= 2, "certificate text produces multiple subject rows");
assert(
  certificateRows.every((row) => row.subjectId && row.grade),
  "certificate rows include subject and grade",
);

const readyCount = certificateRows.filter(
  (row, index, all) =>
    row.subjectId &&
    row.grade &&
    all.findIndex((other) => other.subjectId === row.subjectId) === index,
).length;
assert(readyCount >= 2, "certificate has at least two unique ready rows");

const doubleAwardRows = parseRowsFromText(DOUBLE_AWARD_TEXT);
const scienceRow = doubleAwardRows.find((row) => row.subjectId === "science_double");
assert(scienceRow?.grade === "C" && scienceRow?.grade2 === "C", "science double award CC parses two components");

if (process.exitCode) {
  console.error("\nCertificate import tests failed.");
  process.exit(1);
}
console.log("\nAll certificate import checks passed.");
