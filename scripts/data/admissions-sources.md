# Authoritative admissions sources (Thuto programme data)

Use these when verifying or updating `minPoints`, `subjectRequirements`, and related fields in [`public/data/programmes.json`](../public/data/programmes.json).

## Programme inventory (counts)

| Institution | Programmes | Primary admissions URL | Notes |
|-------------|------------|-------------------------|-------|
| University of Botswana | 125 | https://www.ub.bw/admissions | Full-time guide PDF linked from admissions; local extract in [`ub-prospective-applicants-2025-admissions.txt`](ub-prospective-applicants-2025-admissions.txt) |
| Botho University | 26 | https://www.bothouniversity.ac.bw/admissions | Points tables and programme PDFs on regional Botho sites |
| BIUST | 16 | https://www.biust.ac.bw/entry-requirements/ | Uses combined six-subject score on the official BGCSE A=8 scale (institutional floor >=39); see [`ADMISSIONS-MINPOINTS.md`](../ADMISSIONS-MINPOINTS.md) |
| Botswana School of Business Sciences (BAC) | 9 | https://www.bac.ac.bw/ | Apply via https://thitoacademics.bac.ac.bw/; confirm per programme |
| BA ISAGO University | 9 | https://www.baisago.ac.bw/ | Confirm per programme |
| ABM University College | 9 | https://www.abm.ac.bw/ | Confirm per programme |
| Limkokwing University (Botswana) | 9 | https://www.limkokwing.net/botswana/ | Confirm per programme |
| Gaborone Technical College | 10 | https://www.gtc.ac.bw/ | TVET entry rules differ by programme |

## Repo automation

- `npm run merge-ub-admissions` — runs [`merge-ub-admissions-2025.mjs`](../merge-ub-admissions-2025.mjs): UB 2025 guide overall cut-offs (from [`ub-prospective-applicants-2025-admissions.txt`](ub-prospective-applicants-2025-admissions.txt)) plus UB-wide degree/diploma minima where a programme block is missing from the extract.
- `npm run merge-admission-overrides` — runs [`merge-admission-overrides.mjs`](../merge-admission-overrides.mjs): applies [`admission-overrides.json`](admission-overrides.json) (manual per-id rows) and **BIUST** field defaults derived from the official entry-requirements page (see [`ADMISSIONS-MINPOINTS.md`](../ADMISSIONS-MINPOINTS.md)).

Stubs at **Botho, BSBS (BAC), BA ISAGO, ABM, Limkokwing, FCoE, GTC** still need rows in `admission-overrides.json` once you have verified prospectus minima on the official BGCSE A=8 scale (max best-six = 48).

## UB 2025 PDF (canonical)

Official document: *A Guide to Prospective Applicants 2025 (Undergraduate Admissions)* — `https://www.ub.bw/sites/default/files/2025-03/A-GUIDE-TO-PROSPECTIVE-APPLICANTS-2025-UNDERGRADUATE-ADMISSIONS-1_10032025.pdf`

The checked-in text extract may be incomplete if the PDF is re-exported; re-download and `pdftotext` into `scripts/data/ub-prospective-applicants-2025-admissions.txt` when updating.
