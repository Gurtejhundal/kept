# ReelRecall — Design System Master

This file synthesizes the `mds/reel-link-organizer-mds/DESIGN.md` source of truth with the `designmaxing` audit generated on 2026-07-19.

## Direction

**Soft Editorial Masonry**: a calm, searchable visual archive. Use controlled asymmetry, image-first cards, editorial chronology, and quiet productivity chrome. It must not resemble Instagram, Pinterest, a generic dashboard, or a literal paper scrapbook.

## Design dials

- Variance: 8/10, expressed through four controlled card aspect ratios only.
- Motion: 4/10, limited to 150–300ms opacity/transform feedback.
- Density: 4/10, spacious enough for recognition but efficient for library review.

## Tokens

| Role | Light | Dark |
|---|---|---|
| Canvas | `#F4F5F8` | `#15161A` |
| Warm canvas | `#F7F4F1` | `#17181C` |
| Surface | `#FFFFFF` | `#1C1E23` |
| Soft surface | `#FAFAFC` | `#24272E` |
| Primary text | `#20232B` | `#F1F2F4` |
| Secondary text | `#666C78` | `#B3B8C3` |
| Border | `#E6E8EE` | `#333740` |
| Indigo action | `#7782C8` | `#959FE1` |
| Indigo selected | `#ECEEFA` | `#30354E` |
| Coral confirmation | `#E9877E` | `#E9877E` |
| Success | `#4D8069` | `#79AE96` |
| Warning | `#9B6C2F` | `#D1A66C` |
| Danger | `#A94F56` | `#DB878D` |

## Typography

- Editorial: Instrument Serif for page titles, month headings, collection titles, and empty-state statements.
- Interface: Inter for navigation, forms, buttons, filters, metadata, and card titles.
- Keep serif usage sparse. Never use script fonts or italics as the default voice.

## Layout

- Desktop: ambient pastel field, floating board, 224px sidebar, 4–5 masonry columns.
- Tablet: 76px rail, 3 columns.
- Mobile: full-screen surface, 16px gutters, sticky 56px search, 2 columns, safe-area bottom navigation.
- Controlled image ratios: short `1.28/1`, standard `1/1`, portrait `0.78/1`, tall `0.66/1`.
- Maximum content width: 1500px. No horizontal scroll in the main library.

## Components

- Search is the primary hero, not a secondary toolbar field.
- Cards show thumbnail, title, creator/date, quiet category, and status. Essential metadata is never hover-only.
- Deleted reels retain their image with reduced saturation and a restrained text badge.
- Collections use four-image collages, never folder icons as their main visual.
- Save composer exposes thumbnail, title, category, collection, destination, and one CTA; advanced fields stay collapsed.
- Detail opens as a 420–500px right panel on desktop and a full-screen panel on mobile.

## Interaction and accessibility

- Minimum interactive target: 44×44px with 8px between adjacent targets.
- Full keyboard operation, visible focus rings, skip link, Escape close, and `/` search shortcut.
- Functional text meets WCAG AA; status always includes text or an icon, never color alone.
- Reserve image space, lazy-load below-fold media, and respect `prefers-reduced-motion`.
- Use Lucide outline icons consistently. No emoji, decorative sparkle icons, parallax, confetti, or continuous animation.

## Pre-delivery checks

- Verify 375px, 768px, 1024px, and 1440px widths.
- Verify dark mode and reduced motion independently.
- Confirm the save flow works when metadata and thumbnails are missing.
- Confirm search, date filters, archive/trash restoration, collections, and export remain keyboard accessible.
