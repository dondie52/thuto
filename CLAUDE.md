# Thuto — Claude / Cursor context

Read **`AGENTS.md`** for stack, commands, and coding rules. This file adds product-specific UI conventions agents asked for most often.

## Account drawer (side navigation)

Implementation: `src/components/AccountDrawer.jsx`.

### Tool order (do not reorder without product approval)

**Primary tools** (no section heading):

1. Internships — `/internships`
2. Saved Programmes — `/saved`
3. Compare Programmes — `/compare`

**Thuto Pro** upgrade card (between primary and More tools).

**More tools** (section label: `More tools`):

4. Fit Finder — `/fit-finder`
5. General Settings — `/settings`
6. Support and Feedback — `/support`

Profile is the **drawer title** link (not a list row). Sponsorships and Universities live on Home / desktop nav, not in this drawer list.

### Emoji icons (required for drawer nav items)

Use **emoji** in the drawer, not inline SVG icons. Render with `role="img"` and `aria-label` set to the item label (see `EmojiIcon` in `AccountDrawer.jsx`).

| Tool | Emoji |
|------|-------|
| Internships | 💼 |
| Saved Programmes | 🤍 |
| Compare Programmes | ⚖️ |
| Fit Finder | 🔍 |
| General Settings | ⚙️ |
| Support and Feedback | 💬 |

When adding a new drawer item, pick one clear emoji and add it to this table. Do not mix SVG and emoji in the same drawer list.

### Copy reference

| Tool | Subtitle |
|------|----------|
| Internships | Attachments and graduate programmes |
| Saved Programmes | Your shortlisted options |
| Compare Programmes | Review up to three options side by side |
| Fit Finder | Discover programmes suited to you |
| General Settings | App preferences and data controls |
| Support and Feedback | Report a problem or share ideas |

**Upgrade (non‑Pro):** body mentions programme breakdowns, WhatsApp support, and unlimited application tools; CTA **Upgrade to Pro — P59** (em dash), full width.

## Spelling and labels

- Use **Programmes** (British) in user-facing Thuto copy unless matching an external proper noun.
- Title case for drawer labels: `Saved Programmes`, `Compare Programmes`, `Fit Finder`.

## Design system

Full palette and components: **`DESIGN.md`**. Teal for primary actions; no gradient text; no thick coloured side borders on cards.
