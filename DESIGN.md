---
name: Thuto
description: Botswana university companion for programme eligibility, comparison, and saved choices.
colors:
  surface: "#f3f1ec"
  surface-elevated: "#faf9f6"
  ink: "#0f172a"
  muted: "#57534e"
  brand-50: "#f0fdfa"
  brand-100: "#ccfbf1"
  brand-200: "#99f6e4"
  brand-300: "#5eead4"
  brand-500: "#14b8a6"
  brand-700: "#0f766e"
  brand-800: "#115e59"
  brand-900: "#134e4a"
  warning-bg: "#fef3c7"
  warning-text: "#92400e"
  danger-bg: "#fef2f2"
  danger-text: "#991b1b"
typography:
  display:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0"
  headline:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0"
  title:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0"
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand-700}"
    textColor: "{colors.surface-elevated}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.brand-800}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "12px"
  chip-active:
    backgroundColor: "{colors.brand-700}"
    textColor: "{colors.surface-elevated}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
---

# Design System: Thuto

## 1. Overview

**Creative North Star: "The Calm Admissions Desk"**

Thuto should feel like a focused student utility: warm, trustworthy, and practical. The interface is for comparing programmes, checking eligibility, and returning to saved choices, so the visual system should reduce anxiety rather than perform for attention.

The product surface uses restrained teal, warm stone neutrals, familiar navigation, and clear form controls. Landing pages can be more expressive with photography and motion, but app screens should stay task-first and dense only where density helps comparison.

**Key Characteristics:**
- Warm neutral surfaces with teal reserved for primary action, selection, and state.
- Familiar product UI patterns: sticky top nav, bottom mobile nav, drawers, lists, tables, and inline filters.
- Literata is a brand/display voice, not a general UI font.
- Motion explains state and arrival. It should never delay the task.

## 2. Colors

The palette is warm stone plus Botswana-teal: restrained enough for repeat use, with enough color to signal guidance and progress.

### Primary
- **Admissions Teal** (#0f766e): Primary actions, active navigation, selected filters, focus emphasis, and eligibility highlights.
- **Deep Teal Ink** (#134e4a): Brand headings, high-emphasis teal text, and dark brand panels.
- **Soft Teal Wash** (#f0fdfa): Selected light backgrounds, filter chips, and gentle emphasis panels.

### Neutral
- **Warm Paper** (#f3f1ec): App background and page canvas.
- **Raised Paper** (#faf9f6): Header, drawers, cards, nav shells, and elevated panels.
- **Slate Ink** (#0f172a): Main text and strong UI copy.
- **Stone Muted** (#57534e): Secondary text, explanations, and low-emphasis labels.

### Tertiary
- **Warning Amber** (#fef3c7 / #92400e): Configuration warnings, range validation, and non-blocking caution.
- **Recovery Red** (#fef2f2 / #991b1b): Errors and destructive action text.

### Named Rules

**The Teal Earns Its Place Rule.** Use teal for actions, active states, and trusted status. Do not use it as decoration on every card.

**The Warm Paper Rule.** Product pages should sit on warm paper surfaces, not stark white or pure black.

## 3. Typography

**Display Font:** Literata, with Georgia fallback  
**Body Font:** Figtree, with system-ui fallback  
**Label/Mono Font:** Figtree

**Character:** Literata gives Thuto a human academic voice when used sparingly. Figtree carries the app: legible, modern, and quiet enough for forms and data.

### Hierarchy
- **Display** (700, 2rem+, 1.1): Page and landing headlines only. Avoid using it for buttons, labels, row metadata, or dense UI.
- **Headline** (700, 1.5rem, 1.2): Section starts and major panel titles.
- **Title** (700, 1rem, 1.4): Card titles, row titles, and dialog headings.
- **Body** (400-500, 0.875rem-1rem, 1.6): Explanatory copy and readable product text. Keep prose to 65-75ch.
- **Label** (600-700, 0.75rem, tracked only when uppercase): Form labels, eyebrow text, and compact metadata.

### Named Rules

**The Display Is Rare Rule.** Literata belongs to brand moments and page titles. Dense product UI uses Figtree.

**The No Tiny Maze Rule.** Mobile controls should not drop below 10px labels, and tappable controls should stay near 44px minimum height.

## 4. Elevation

Thuto uses a hybrid of tonal layering and soft shadows. Surfaces are primarily separated by warm background shifts and 1px borders; shadows appear for cards, sticky navigation, drawers, and hover feedback.

### Shadow Vocabulary
- **Card** (`0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.08)`): Standard product cards and repeated list containers.
- **Card Hover** (`0 2px 4px rgba(15, 23, 42, 0.06), 0 16px 40px -8px rgba(15, 23, 42, 0.12)`): Interactive cards only.
- **Nav** (`0 -4px 24px rgba(15, 23, 42, 0.06)`): Mobile bottom navigation.
- **Panel** (`0 20px 70px -36px rgba(19, 78, 74, 0.34), 0 1px 2px rgba(15, 23, 42, 0.05)`): Larger elevated panels and auth surfaces.

### Named Rules

**The Border Before Shadow Rule.** Prefer border and tonal contrast at rest. Add shadow when a surface floats, sticks, or responds to interaction.

## 5. Components

### Buttons
- **Shape:** Rounded rectangles or pills depending on context. Product buttons default to 12px radius; landing CTAs may use full pills.
- **Primary:** Admissions Teal background (#0f766e), raised-paper text, semibold Figtree, 10-12px vertical padding.
- **Hover / Focus:** Darken to #115e59 or #134e4a. Focus uses the shared teal ring, not a custom decorative treatment.
- **Secondary / Ghost:** Raised Paper background with teal text and a 1px teal or stone border.

### Chips
- **Style:** Soft Teal Wash background with teal text for passive chips. Active chips invert to Admissions Teal with raised-paper text.
- **State:** Chips summarize state or act as compact filters. Do not repeat a select menu with a full chip cloud unless it materially speeds the task.

### Cards / Containers
- **Corner Style:** 16px for product cards, 24px for large drawers or hero-like containers.
- **Background:** Raised Paper or white-like warm surfaces.
- **Shadow Strategy:** Use the Card shadow for containers, Card Hover for interactive cards only.
- **Border:** 1px stone or teal-tinted borders. Avoid thick side stripes.
- **Internal Padding:** 16px on compact cards, 24px+ on major panels.

### Inputs / Fields
- **Style:** Raised Paper background, 1px brand-200 border, 8px radius, Figtree body text.
- **Focus:** Brand-500 border plus a 2px brand-400 ring.
- **Error / Disabled:** Error messages use red text on red wash. Disabled controls lower opacity and keep labels readable.

### Navigation
- **Desktop:** Sticky top bar with full labels. Active state is teal fill with white text.
- **Mobile:** Five primary destinations maximum in the bottom nav. Secondary destinations live in the account drawer.
- **Drawer:** Right-side product drawer with focus trap, Escape close, body scroll lock, and sectioned navigation.

### Programme Result Row

Rows should answer the first browsing question: what is this, where is it offered, what points are needed, and what career direction does it suggest. Requirements, subjects, and fit details belong on the programme detail page.

## 6. Do's and Don'ts

### Do:
- **Do** keep product screens search-first and task-first.
- **Do** use teal for primary actions, selected navigation, focus, and meaningful state.
- **Do** keep secondary destinations in the account drawer on mobile.
- **Do** preserve reduced-motion behavior for all imperative scrolls and animated reveals.
- **Do** use skeleton states for content loading where lists or panels are expected.
- **Do** use warm paper surfaces instead of pure white or pure black.

### Don't:
- **Don't** use `border-left` or `border-right` wider than 1px as a colored card accent.
- **Don't** use gradient text.
- **Don't** default to glassmorphism or blurred cards for product UI.
- **Don't** recreate the hero-metric template: big number, small label, decorative stats.
- **Don't** show every filter, shortcut, and caveat before the student sees results.
- **Don't** make users wait through decorative page-load choreography in the app.
- **Don't** use Literata for compact labels, buttons, dense tables, or nav items.
