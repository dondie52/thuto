# Pillar 1 - Smart BGCSE Predictor

## Overview
Replace the current fixed 6-subject form with a dynamic predictor that accepts all BGCSE subjects, automatically selects the best 6, calculates the total points, and matches the student against all programmes in the database.

---

## Grading Scale
| Grade | Points |
|-------|--------|
| A | 6 |
| B | 5 |
| C | 4 |
| D | 3 |
| E | 2 |
| U | 0 |

Total = sum of best 6 subjects (highest points first).

---

## Full BGCSE Subject List
```js
export const BGCSE_SUBJECTS = [
  "Mathematics",
  "English Language",
  "Setswana",
  "Biology",
  "Chemistry",
  "Physics",
  "Combined Science",
  "Social Studies",
  "History",
  "Geography",
  "Agriculture",
  "Business Studies",
  "Accounting",
  "Computer Studies",
  "Design & Technology",
  "Art & Design",
  "Home Management",
  "Physical Education",
  "Music",
  "Religious Education",
  "French",
  "Development Studies",
]
```

---

## Component: `Predictor.jsx`

### State
```js
const [subjects, setSubjects] = useState([
  { subject: '', grade: '' }
])
const [results, setResults] = useState(null)
```

### UI Structure
1. **Header section**
   - Title: "Admission predictor"
   - Subtitle: "Enter your BGCSE subjects and grades. We'll calculate your best 6 points total."
   - Points key: A=6, B=5, C=4, D=3, E=2

2. **Subject rows** (dynamic)
   - Each row: `[Subject dropdown] [Grade dropdown] [Remove button]`
   - Subject dropdown: list from BGCSE_SUBJECTS, filtered to exclude already-selected subjects
   - Grade dropdown: A, B, C, D, E, U
   - "Add subject" button below rows (disabled when 9 subjects reached)
   - Minimum 1 row, maximum 9 rows

3. **Action buttons**
   - "Check programmes" (primary, teal)
   - "Clear" (secondary)

4. **Results section** (shown after submission)
   - Points summary card showing:
     - Total points (best 6)
     - Which 6 subjects were counted (highlighted)
     - Which subjects were dropped (greyed out)
   - List of matching programmes (sorted by min points descending)
   - Each result shows: programme name, university, min points, status badge

### Best-6 Calculation Logic
```js
function calculateBestSix(subjects) {
  const gradePoints = { A: 6, B: 5, C: 4, D: 3, E: 2, U: 0 }
  
  const scored = subjects
    .filter(s => s.subject && s.grade)
    .map(s => ({ ...s, points: gradePoints[s.grade] }))
    .sort((a, b) => b.points - a.points)
  
  const bestSix = scored.slice(0, 6)
  const dropped = scored.slice(6)
  const total = bestSix.reduce((sum, s) => sum + s.points, 0)
  
  return { bestSix, dropped, total }
}
```

### Programme Matching Logic
```js
function matchProgrammes(totalPoints, programmes) {
  return programmes
    .map(prog => {
      const diff = totalPoints - prog.minPoints
      let status
      if (diff >= 4) status = 'safe'
      else if (diff >= 0) status = 'target'
      else if (diff >= -3) status = 'reach'
      else status = 'unlikely'
      return { ...prog, status }
    })
    .filter(p => p.status !== 'unlikely')
    .sort((a, b) => b.minPoints - a.minPoints)
}
```

### Status Badge Colors
| Status | Label | Color |
|--------|-------|-------|
| safe | Safe choice | Green |
| target | Good match | Teal |
| reach | Reach | Amber |
| unlikely | (hidden) | - |

---

## Data: `programmes.json` additions needed
Each programme needs:
```json
{
  "id": "ub-bsc-cs",
  "name": "BSc Computer Science",
  "university": "University of Botswana",
  "minPoints": 30,
  "subjectRequirements": [
    { "subject": "Mathematics", "minGrade": "C" },
    { "subject": "English Language", "minGrade": "C" }
  ]
}
```

Add `subjectRequirements` to all existing programmes.

---

## Subject Requirement Check
After calculating best 6, also check specific subject requirements:
```js
function checkSubjectRequirements(subjects, programme) {
  const gradePoints = { A: 6, B: 5, C: 4, D: 3, E: 2, U: 0 }
  return programme.subjectRequirements.every(req => {
    const studentSubject = subjects.find(s => s.subject === req.subject)
    if (!studentSubject) return false
    return gradePoints[studentSubject.grade] >= gradePoints[req.minGrade]
  })
}
```

If subject requirements not met, show warning on the result card:
"⚠ Requires C in Mathematics - check your grade"

---

## UX Details
- Results appear below the form (no page navigation)
- Smooth scroll to results after submission
- "Share results" button copies a summary text for WhatsApp:
  "I scored 34 pts on Thuto - I qualify for BSc Computer Science, BA Economics and 3 more. Check yours at thuto.bw"
- "Try different grades" button scrolls back up to form

---

## File Structure
```
src/
  pages/
    Predictor.jsx        ← main page component
  components/
    SubjectRow.jsx       ← single subject + grade row
    PointsSummary.jsx    ← best-6 breakdown card
    ProgrammeResult.jsx  ← individual result card with status badge
  utils/
    predictor.js         ← calculateBestSix, matchProgrammes, checkSubjectRequirements
  data/
    subjects.js          ← BGCSE_SUBJECTS list
    programmes.json      ← programme data with subjectRequirements
```
