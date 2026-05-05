# `minPoints` semantics for editors

## What Thuto stores

- **`minPoints`**: A single number on the **official Botswana BGCSE best-six scale** (A\*=8, A=8, B=7, C=6, D=5, E=4, F=3, G=2, U=0; max total = **48**), matching [`src/lib/admissions.js`](../src/lib/admissions.js) and the predictor UI.
- **`subjectRequirements`**: Optional minimum letter grades for keys in `SUBJECT_FIELDS` (`math`, `english`, `science`, etc.). The predictor requires **both** sufficient best-six total **and** these grades when present.
- **`minPointsScaleVersion`**: Stamped by [`scripts/migrate-grade-scale.mjs`](migrate-grade-scale.mjs); version `2` = official BGCSE A=8 scale.

## Tiers of meaning

1. **`prospectus` / published cut-off (UB)** — Overall “Application Cut-Off Points (Best 6 Subjects)” from the official UB undergraduate admissions guide (e.g. 2025). These are **guides**, not final admission cut-offs; UB states admission remains competitive.
2. **`institution_minimum`** — Stated **minimum** for the whole class of programmes on the same scale. Example: UB 2025 general rule — **46** best-six points for **degree** programmes and **42** for **diploma/certificate** programmes (NCQF Level 4 pathway), where a programme-specific guide line is not present in our extract.
3. **`converted_official`** — Historical label retained from when Thuto used its own internal scale. Now that Thuto stores values on the **official** BGCSE A=8 scale, no conversion is needed; tier kept for provenance (see BIUST defaults in [`merge-admission-overrides.mjs`](merge-admission-overrides.mjs), where the institutional floor is **39**).

## Unknown / postgraduate

- If entry is **not** normal school-leaving (e.g. postgraduate diploma requiring a prior degree), leave **`minPoints` null** and avoid implying a BGCSE points rule.

## Optional provenance fields

`programmes.json` objects may include (ignored by the app, useful for audits):

- `minPointsSource` — short citation, e.g. `"UB 2025 prospective applicants guide §general f"`.
- `minPointsTier` — one of `guide_overall`, `institution_minimum`, `converted_official`, `manual`.

## Editing workflow

1. Prefer **official PDFs** for the intake year you care about.
2. For UB, run `node scripts/merge-ub-admissions-2025.mjs` after refreshing `scripts/data/ub-prospective-applicants-2025-admissions.txt`.
3. For other universities, add rows to [`scripts/data/admission-overrides.json`](data/admission-overrides.json) and run `node scripts/merge-admission-overrides.mjs`.
