# Product

## Register

product

## Users

Botswana secondary-school leavers and current students exploring tertiary education. They use Thuto on mobile-first devices, often under time pressure during application windows, with uneven connectivity. They need clear answers: which programmes they likely qualify for, how to compare options, and where to apply — not marketing fluff.

## Product Purpose

Thuto is a Botswana tertiary companion: a PWA that helps students check BGCSE admission eligibility, browse and compare programmes, save choices, and navigate university application logistics. Success means a student can move from "what can I study?" to a shortlist and next steps without leaving the app confused. Community features (feed, shared results) support peer discovery but must not distract from the core admissions task.

## Brand Personality

**Calm, trustworthy, practical.** Thuto should feel like a focused admissions desk — warm paper surfaces, restrained teal for actions, and copy that respects the student's time. Expressive brand moments (Literata headlines, landing reveal) are reserved for entry and partner marketing; dense product screens stay task-first.

Reference feel: a well-run student services office, not a startup landing page or social app.

## Anti-references

- Generic AI SaaS: Inter + purple gradients, dark mesh heroes, three equal feature cards, glassmorphism cards
- Social-feed chrome on admissions tasks: infinite decorative motion, stat-block hero metrics, gradient text
- Over-decorated product UI: side-stripe card accents, blurred glass panels, Literata in dense labels/nav
- Page-load theater inside the app: long choreographed reveals on routes students hit daily
- Trust-eroding patterns: hiding filters behind mystery, showing every caveat before results, fake urgency

## Design Principles

1. **Search-first, task-first.** Every product screen should answer the student's immediate question before surfacing secondary tools or upsells.
2. **Teal earns its place.** Use brand teal for actions, selection, focus, and meaningful state — not as decoration on every surface.
3. **Warm utility over cold tech.** Paper-toned backgrounds and readable Figtree body text signal a human service, not a generic dashboard.
4. **Motion supports state, not spectacle.** Animations explain change or give feedback; they never delay repeat workflows (nav, likes, filters).
5. **Guidance, not guarantee.** Copy and UI present curated data as helpful guidance; official university sources remain authoritative.

## Accessibility & Inclusion

- Target **WCAG 2.1 AA** for contrast, focus visibility, and touch targets (44px minimum on mobile controls).
- Honor **`prefers-reduced-motion`**: keep opacity/color transitions where helpful; drop or shorten movement on scroll reveals and imperative navigation.
- Gate hover-only motion behind `@media (hover: hover) and (pointer: fine)`.
- Avoid color-only status encoding; pair eligibility pills and warnings with text labels.
- Mobile-first layouts must remain usable on small screens and slow networks (skeleton states, no blocking decorative loaders).
