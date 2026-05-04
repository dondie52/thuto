# Pillar 3 - Programme Profiles, Compare & Reach/Safe Split

## Overview
Transform the flat programmes list into rich individual profile pages with full detail, a side-by-side comparison tool, and a reach/safe/target badge system so students can make informed decisions.

---

## Route Structure
```
/programmes              → list page (existing, enhanced)
/programmes/:id          → detail page (new)
/compare?ids=id1,id2     → comparison page (new)
```

---

## Data: `programmes.json` - Full Schema

Update every programme entry to this shape:

```json
{
  "id": "ub-bsc-cs",
  "name": "BSc Computer Science",
  "university": "University of Botswana",
  "universityShort": "UB",
  "faculty": "Faculty of Science",
  "field": "Technology",
  "duration": 4,
  "durationUnit": "years",
  "minPoints": 30,
  "subjectRequirements": [
    { "subject": "Mathematics", "minGrade": "C" },
    { "subject": "English Language", "minGrade": "C" }
  ],
  "description": "A four-year degree covering software development, algorithms, data structures, networking, and systems design. Graduates work in software engineering, data science, and IT management across Botswana and internationally.",
  "modules": {
    "year1": ["Introduction to Programming", "Discrete Mathematics", "Computer Organisation", "English Communication"],
    "year2": ["Data Structures & Algorithms", "Database Systems", "Operating Systems", "Software Engineering"],
    "year3": ["Computer Networks", "Artificial Intelligence", "Human-Computer Interaction", "Project Management"],
    "year4": ["Final Year Project", "Advanced Topics", "Electives (x2)"]
  },
  "careers": [
    "Software Engineer",
    "Systems Analyst",
    "Data Scientist",
    "IT Manager",
    "Network Administrator",
    "Web Developer"
  ],
  "fees": {
    "domestic": 18000,
    "currency": "BWP",
    "per": "year",
    "note": "Approximate - verify with university"
  },
  "applicationDeadline": "2025-09-30",
  "applyUrl": "https://admissions.ub.bw",
  "officialUrl": "https://www.ub.bw/programmes/bsc-computer-science"
}
```

### Field categories (for filtering)
```js
export const FIELDS = [
  "Technology",
  "Business",
  "Engineering",
  "Health Sciences",
  "Natural Sciences",
  "Humanities",
  "Education",
  "Law",
  "Agriculture",
]
```

---

## Page: `ProgrammeList.jsx` (enhanced)

### Add to existing list:
- Search bar (filter by name, university, field)
- Field filter chips: All | Technology | Business | Engineering | ...
- Sort: Min points (low/high), Alphabetical
- If student has predictor results in session → show status badge on each row
- "Compare" checkbox on each row (max 3 selected)
- Sticky "Compare selected (2)" button at bottom when 2+ selected

### Search + filter logic
```js
function filterProgrammes(programmes, { search, field, university, maxPoints }) {
  return programmes.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.university.toLowerCase().includes(search.toLowerCase())
    const matchField = !field || p.field === field
    const matchUni = !university || university === 'All' || p.university === university
    const matchPoints = !maxPoints || p.minPoints <= maxPoints
    return matchSearch && matchField && matchUni && matchPoints
  })
}
```

---

## Page: `ProgrammeDetail.jsx`

### Layout (top to bottom)
```
[Back to programmes]

BSc Computer Science                    [+ Compare] [Bookmark]
University of Botswana · 4 years · Technology

[Status badge: Safe choice / Good match / Reach]  ← only if predictor used
Points: Min 30  |  Your score: 34  |  +4 above minimum

────────────────────────────────────────────────────────

About this programme
[description paragraph]

Entry requirements
· Minimum 30 points
· C in Mathematics
· C in English Language

Modules
Year 1  [pill list]
Year 2  [pill list]
Year 3  [pill list]
Year 4  [pill list]

Career paths
[career badge chips]

Fees
~BWP 18,000 / year (approximate - verify with university)

Application
Deadline: 30 September 2025
[Apply at UB →]  [Official programme page →]

────────────────────────────────────────────────────────

Community admission data   ← AdmissionStats component (Pillar 2)

────────────────────────────────────────────────────────

Similar programmes
[3 programme cards from same field]
```

### Bookmark logic
```js
function toggleBookmark(programmeId) {
  const saved = JSON.parse(localStorage.getItem('thuto_saved') || '[]')
  const exists = saved.includes(programmeId)
  const updated = exists
    ? saved.filter(id => id !== programmeId)
    : [...saved, programmeId].slice(-10) // max 10
  localStorage.setItem('thuto_saved', JSON.stringify(updated))
}
```

---

## Page: `Compare.jsx`

Route: `/compare?ids=ub-bsc-cs,biust-bsc-ds`

### Layout
Side-by-side table. On mobile: horizontal scroll.

### Comparison rows
| Row | Example |
|-----|---------|
| University | UB / BIUST |
| Duration | 4 years / 4 years |
| Min points | 30 / 31 |
| Your status | Safe / Target |
| Subject requirements | Maths C, English C / Maths B, English C |
| Field | Technology / Technology |
| Fees (approx) | BWP 18,000/yr / BWP 20,000/yr |
| Careers | [chips] / [chips] |
| Apply deadline | 30 Sep 2025 / 31 Aug 2025 |
| Apply link | [Apply →] / [Apply →] |

### Highlight differences
```js
// If a value differs between programmes, highlight the better one in teal
function isBetter(field, valA, valB) {
  if (field === 'minPoints') return valA < valB  // lower is easier
  if (field === 'fees') return valA < valB        // lower is cheaper
  return false
}
```

### Entry point
- "Compare selected" button on list page
- "Add to compare" button on detail page
- Share URL: `/compare?ids=id1,id2,id3` - shareable via WhatsApp

---

## Component: `StatusBadge.jsx`

Used on list rows, detail page, and compare table.

```jsx
const STATUS_CONFIG = {
  safe:     { label: 'Safe choice',  bg: '#EAF3DE', color: '#27500A' },
  target:   { label: 'Good match',   bg: '#E1F5EE', color: '#085041' },
  reach:    { label: 'Reach',        bg: '#FAEEDA', color: '#633806' },
  unlikely: { label: 'Unlikely',     bg: '#FCEBEB', color: '#791F1F' },
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status]
  return (
    <span style={{
      background: config.bg,
      color: config.color,
      padding: '3px 10px',
      borderRadius: '99px',
      fontSize: '12px',
      fontWeight: 500,
    }}>
      {config.label}
    </span>
  )
}
```

---

## Page: `Saved.jsx`

Route: `/saved`

- Reads bookmark IDs from localStorage
- Displays saved programme cards
- "Compare selected" button
- "Remove" option per card
- Empty state: "No saved programmes yet - browse Programmes"

---

## File Structure
```
src/
  pages/
    ProgrammeList.jsx      ← enhanced list with search/filter
    ProgrammeDetail.jsx    ← full programme profile page
    Compare.jsx            ← side-by-side comparison
    Saved.jsx              ← bookmarked programmes
  components/
    StatusBadge.jsx        ← safe/target/reach pill
    ProgrammeCard.jsx      ← reusable card (list + saved)
    ModulesList.jsx        ← year-by-year modules display
    CareerChips.jsx        ← career path badges
    CompareTable.jsx       ← comparison rows with diff highlighting
  utils/
    programmes.js          ← filterProgrammes, sortProgrammes
    bookmarks.js           ← toggleBookmark, getBookmarks
  data/
    programmes.json        ← full updated data
```

---

## Data Entry Checklist
For each programme, fill in:
- [ ] description (2–3 sentences)
- [ ] modules (year 1 at minimum)
- [ ] careers (4–6 options)
- [ ] fees (mark as approximate)
- [ ] applicationDeadline
- [ ] applyUrl
- [ ] officialUrl
- [ ] subjectRequirements
- [ ] field category

Current programmes to update:
- [ ] BSc Computer Science (UB)
- [ ] BA Economics (UB)
- [ ] BSc Biology (UB)
- [ ] BEng Mechanical Engineering (BIUST)
- [ ] BSc Data Science (BIUST)
- [ ] BSc Environmental Science (BIUST)
- [ ] BCom Accounting (BAC)
- [ ] Diploma in Marketing (BAC)
