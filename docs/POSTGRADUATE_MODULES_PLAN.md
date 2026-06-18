# Postgraduate & PhD Modules — Research & Implementation Plan

**Thuto** (Botswana University Companion) currently has **43 postgraduate programmes** in `public/data/programmes.json`, but only **1 has module data** (`ub-post-graduate-diploma-education`). There are **zero PhD/MPhil entries** despite UB alone listing **70+ graduate programmes** on its website.

This plan covers how to add postgraduate and doctoral programmes with accurate module/course structures for every institution in the catalogue.

---

## 1. Current state (audit)

| Metric | Count |
|--------|-------|
| Total programmes in catalogue | ~955 |
| Postgraduate programmes (Masters, PGD, MBA, etc.) | 43 |
| With populated `modules` array | 1 |
| PhD / MPhil programmes | 0 |
| UB graduate programmes on ub.bw | ~70 |
| Institutions with PG programmes but no modules | GUC (17), BUAN (11), BOU (5), IDM (3), others |

**Gap:** Undergraduate UB modules were merged from the undergraduate calendar PDF (`merge-ub-modules-from-calendar.mjs`). No equivalent graduate calendar exists in the repo. Graduate programme stubs were explicitly skipped in `build-programmes-catalog.mjs` (line 61 filters out `master-`, `mphil`, `executive-` URLs).

---

## 2. Data model differences

### Taught postgraduate (Masters, PGD, PGC, MBA)

Use the **existing semester-block format** already used for undergrad:

```json
"modules": [
  { "semester": 1, "modules": ["MGT750 - Organizational Theory and Behavior", "ACC700 - Management Accounting"] },
  { "semester": 2, "modules": ["FIN720 - Financial Management and Policy"] }
]
```

Typical structure (verified from UB MBA page):
- **12 core courses + 4 electives + dissertation** (MBA, 5–6 semesters)
- **MSc**: coursework semesters + research essay or dissertation
- **PGD/PGC**: 2–4 semesters of focused courses

### Research degrees (MPhil / PhD)

UK/Botswana PhDs are **research-based**, not taught. Per [UB School of Graduate Studies](https://www.ub.bw/discover/administration-and-support/school-graduate-studies) and [HEFCE doctoral characteristics](https://dera.ioe.ac.uk/id/eprint/21805/1/Doctoral-Degree-Characteristics.pdf):

- **No fixed semester module list** like undergrad
- Students complete: proposal → confirmation → annual reviews → thesis → viva
- Optional skills training (research methods, ethics, statistics) via graduate school

**Recommended Thuto representation** — use **research phases** instead of fake course codes:

```json
"modules": [
  { "semester": "Year 1", "modules": ["Research proposal and literature review", "Confirmation of candidature"] },
  { "semester": "Years 2–3", "modules": ["Independent research under supervision", "Annual progress reviews"] },
  { "semester": "Final", "modules": ["Thesis writing and submission", "Viva voce examination"] }
],
"qualification": "Postgraduate",
"tags": ["PhD", "Research"]
```

For **Integrated PhD / MRes** (first year taught, then research), use semester blocks for Year 1 only.

### Professional doctorates (MMed, DBA)

- **MMed** (UB Faculty of Medicine): 4-year clinical specialty training with sequenced rotations — scrape from [ub.bw MMed page](https://www.ub.bw/programmes/medicine/master-medicine-mmed)
- Structure: specialty blocks per year, not generic semesters

---

## 3. Official data sources by institution

### University of Botswana (UB) — **Priority 1**

| Source | URL | Content |
|--------|-----|---------|
| Graduate programme list (2025) | [List-of-Graduate-Programmes_12032025.pdf](https://www.ub.bw/sites/default/files/2025-03/List-of-Graduate-Programmes_12032025.pdf) | All Masters, PGD, MPhil/PhD streams, entry requirements |
| Programme pages (70 links) | `scripts/ub-programmes-page.txt` (Graduate section) | Per-programme module lists, e.g. [MBA](https://www.ub.bw/programmes/business/master-business-administration-mba), [MSc Mathematics](https://www.ub.bw/programmes/science/mathematics/master-science-degree-mathematics) |
| Graduate applications | [ub.bw/study/graduate-applications](https://www.ub.bw/study/graduate-applications) | Application deadlines, MPhil/PhD continuous intake |
| School of Graduate Studies | [ub.bw/.../school-graduate-studies](https://www.ub.bw/discover/administration-and-support/school-graduate-studies) | Overview of qualification types |

**Verified module examples (from web scrape, June 2025):**

**MBA core courses:**
- MGT751 Management Simulation, MIS, Controlling
- MGT750 Organizational Theory and Behavior
- MKT778 Business Presentation Skills Seminar
- MGT743 Strategic Management
- MKT760 Marketing Strategy
- ACC700 Management Accounting for Business Decisions
- FIN720 Financial Management and Policy
- MGT741 Business Research Methods
- ECO717 Managerial Economics for Business
- MGT742 Operations Management
- LAW711 Business Law
- MKT761 Consumer and Buyer Behavior
- Plus 4 optional electives + 24-credit dissertation

**MSc Mathematics** (Pure stream): MAT631, MAT651, MAT616, MAT622, MAT632, MAT644, MAT611, MAT613, MAT615, MAT633, MAT641, MAT649, MAT702 Research Essay, MAT700 Supervised Research Dissertation

### Gaborone University College (GUC) — **Priority 2**

| Source | Content |
|--------|---------|
| [guc.ac.bw/courses_group/masters](https://www.guc.ac.bw/courses_group/masters) | Master of Public Health, MSc OHS, MSc ECD |
| GUC brochure PDF (`docs/2025Programmes_copy.pdf`) | 17 postgraduate programme names (already in catalogue) |
| Individual course pages | Curriculum tabs exist but are **JS-rendered** — may need headless browser or manual curation |

**17 programmes in catalogue, 0 with modules.** Brochure is scanned/image-only per `ensure-guc-programmes-contents-2025.mjs`.

### Botswana Open University (BOU) — **Priority 3**

| Source | Content |
|--------|---------|
| `docs/botswana open university 2025_26_Prospectus_copy.pdf` | EMBA, EMPA, M.Ed programmes (names + descriptions) |
| [bou.ac.bw](https://www.bou.ac.bw/) | Programme detail pages |

5 postgraduate programmes in catalogue; prospectus merge script exists but does not extract modules.

### Botswana University of Agriculture and Natural Resources (BUAN) — **Priority 4**

| Source | Content |
|--------|---------|
| [buan.ac.bw/postgraduate-programmes](https://www.buan.ac.bw/index.php/postgraduate-programmes) | 11 MSc/MPhil programmes |
| Faculty handbooks | Module lists (to be sourced) |

### Other institutions

| Institution | PG programmes | Module source status |
|-------------|-----------------|---------------------|
| IDM | 3 (UK-partnered MSc) | Partner university module guides |
| ISBS | 1 (PGD Management) | Prospectus PDF |
| BIBF | 2 (PGC/PGD banking) | [bibf.co.bw](https://www.bibf.co.bw) |
| Assembly Bible College | 2 (MA Biblical/Ministerial) | College handbook |
| BSBS/BAC | 1 (PGD Taxation) | BAC prospectus |

---

## 4. International reference patterns (for validation)

When Botswana institution data is sparse, use these as **structure templates** (not to copy verbatim):

| Programme type | Typical modules (UK MSc reference) |
|----------------|-----------------------------------|
| MSc Data Science | Research Methods, Programming for Data Science, Machine Learning, Big Data, Dissertation |
| MSc Computer Science | Foundations of Computing, Algorithms, Dissertation + electives |
| MBA | Research Methods, Strategic Management, Finance, Marketing, Operations, Dissertation |
| PhD (research) | Proposal, independent research, thesis, viva — **no taught module list** |

Sources: [Warwick MSc CS 2024/25](https://warwick.ac.uk/fac/sci/dcs/teaching/courses/csa-msc-2425/), [Leeds MSc Advanced CS](http://catalogue.leeds.ac.uk/Programme/202425?code=MSC-ACS%2FD-FT), [Imperial MSc ML & DS module guide](https://www.imperial.ac.uk/media/imperial-college/faculty-of-natural-sciences/department-of-mathematics/MSc-Machine-Learning-and-Data-Science-Module-Guide-2025-26.pdf)

---

## 5. Implementation phases

### Phase 1 — UB graduate catalogue + module scrape (this PR)

1. **`scripts/merge-ub-graduate-programmes.mjs`** — Parse Graduate section of `ub-programmes-page.txt`; add ~70 programmes with `qualification: "Postgraduate"`, correct duration, `minPoints: null`, faculty, official URLs.
2. **`scripts/scrape-ub-graduate-modules.mjs`** — Fetch each UB graduate programme page; extract course codes (`[A-Z]{2,4}\d{3}`) and titles; group by semester when detectable.
3. **PhD/MPhil research-phase templates** — For programmes matching `/mphil|phd/i`, apply research-phase module structure (not invented course codes).
4. **npm script** — `merge-ub-graduate` in `package.json`.

**Expected outcome:** ~70 new UB programmes; modules for programmes with scrapeable pages (MBA, MSc Math, MEd, etc.).

### Phase 2 — Other Botswana institutions

1. **GUC** — Manual curation from brochure OCR or contact college for module lists; add `merge-guc-postgraduate-modules.mjs`.
2. **BOU** — Extend `merge-bou-prospectus-2025-26.mjs` to parse postgraduate module sections if present in PDF.
3. **BUAN** — Scrape/crawl `buan.ac.bw` postgraduate pages.
4. **IDM, ISBS, BIBF** — Prospectus PDFs + website scrape.

### Phase 3 — App & UX

1. **Fit Finder** — Add `postgraduate` and `phd` to `QUALIFICATION_LEVEL_OPTIONS` in `src/lib/fitFinder.js`.
2. **Programme detail page** — Render `modules` section in `ProgrammeDetail.jsx` (currently missing despite data in JSON).
3. **Assistant** — Already uses modules in `assistantEngine.js`; will benefit automatically.
4. **Admission logic** — Ensure `minPoints: null` for all PG programmes; entry = prior degree, not BGCSE points.

### Phase 4 — Maintenance

1. Annual refresh when UB publishes new graduate list (March each year).
2. `discover-university-resources.mjs` — Add `graduate|postgraduate|mphil|phd` to priority path regex.
3. Content editor overrides via Supabase for corrections.

---

## 6. Technical approach

```
ub-programmes-page.txt (Graduate section)
        │
        ▼
merge-ub-graduate-programmes.mjs ──► programmes.json (new PG rows)
        │
        ▼
scrape-ub-graduate-modules.mjs ──► programmes.json (modules patched)
        │
        ▼
postgraduate-modules-curated.json (manual overrides for edge cases)
        │
        ▼
merge-postgraduate-modules-curated.mjs
```

**Scraping rules:**
- Match course codes: `[A-Z]{2,4}\d{3}` (e.g. MGT751, MAT631, EFH500)
- Detect semester headers: `Semester 1`, `Semester 2`, `Year 1 Semester 1`
- For PhD pages: if no course codes found, apply research-phase template
- Set `profileCompleteness: "partial"` when modules are template-only

**Do not:**
- Invent specific course codes for programmes without official sources
- Copy UK university modules into Botswana programme records
- Set BGCSE `minPoints` on postgraduate programmes

---

## 7. Priority order

| Priority | Institution | Programmes | Effort | Module source quality |
|----------|-------------|------------|--------|----------------------|
| 1 | UB | ~70 | Medium | High (official programme pages) |
| 2 | GUC | 17 | High | Low (JS site, scanned brochure) |
| 3 | BOU | 5 | Low | Medium (prospectus PDF) |
| 4 | BUAN | 11 | Medium | Medium (website) |
| 5 | IDM, ISBS, BIBF, others | 8 | Low | Variable |

---

## 8. Success criteria

- [x] All UB graduate programmes from `ub-programmes-page.txt` exist in `programmes.json`
- [x] Taught UB programmes (MBA, MSc, MEd, MPA, etc.) have verified or scraped module lists where available on ub.bw
- [x] All MPhil/PhD programmes use research-phase structure (not fake semester courses)
- [x] All non-UB postgraduate programmes receive modules from institution sources or programme-type templates
- [x] Fit Finder can filter by postgraduate / PhD level
- [x] Programme detail page displays modules for students browsing

## 9. Refresh pipeline

Run the full postgraduate data refresh:

```bash
npm run merge-postgraduate
```

This executes: UB graduate catalogue → UB module scrape → curated/template merge → validation.

---

## 10. Implementation status (all phases complete)

| Phase | Status | Deliverables |
|-------|--------|--------------|
| 1 — UB catalogue + scrape | Done | `merge-ub-graduate-programmes.mjs`, `scrape-ub-graduate-modules.mjs` |
| 2 — Other institutions | Done | `postgraduate-modules-curated.json`, `postgraduateModuleTemplates.mjs` |
| 3 — App UX | Done | `ProgrammeModulesSection`, Fit Finder postgraduate/PhD filters |
| 4 — Maintenance | Done | `validate-postgraduate-modules.mjs`, `npm run merge-postgraduate`, discover script update |

**Coverage:** 116 postgraduate programmes, all with module data (scraped, curated, or programme-type template).

---

## 11. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| UB pages change structure | Version scrape script; store `officialUrl` for manual check |
| GUC curriculum behind JavaScript | Manual curation JSON; request PDF from institution |
| PhD “modules” mislead students | Use phase labels, tag as Research, link to graduate school |
| Duplicate programme IDs | Slug from URL path; dedupe on merge |
| Stale data | `profileCompleteness` + source year in description |

---

*Last updated: June 2025 — all four phases implemented.*
