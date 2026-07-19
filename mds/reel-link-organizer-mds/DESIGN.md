# DESIGN.md — ReelRecall Visual Design Specification

## 1. Design direction

### Official style name
**Soft Editorial Masonry**

### Supporting description
A **digital scrapbook / visual knowledge archive** combining:

- Editorial magazine typography
- A calm pastel atmosphere
- A white, gallery-like content canvas
- Image-first masonry cards
- Minimal navigation
- Organic card variation
- Lightweight productivity behavior

This visual language should feel closer to a personal memory board than a conventional bookmark manager.

The interface must not copy the reference product directly. The design should reuse the underlying visual principles while developing its own identity, navigation, card anatomy, iconography, and color system.

---

## 2. Product-design interpretation

The reference works because it does not make every saved object look identical. Images, quotations, notes, articles, products, and lists retain different visual shapes. That variation creates memory cues.

ReelRecall should apply the same principle to Instagram link organization:

- Fashion links can appear image-dominant.
- Course links can show an editorial title card.
- Restaurant links can show a place card.
- Notes and reminders can use text-based cards.
- Deleted reels can retain their thumbnail but display a restrained status layer.
- Collections should feel curated rather than filed.

The product should look like a living visual memory surface, not a database rendered as cards.

---

## 3. Core visual principles

### 3.1 Visual recognition before metadata
The thumbnail is the strongest memory trigger. It must dominate the card.

### 3.2 Quiet interface, expressive content
Navigation and controls should remain neutral. The saved content provides most of the visual color.

### 3.3 Editorial hierarchy
Large expressive page titles should coexist with clean, functional UI text.

### 3.4 Controlled irregularity
Card heights can vary, but spacing, alignment, and card widths must remain disciplined.

### 3.5 Warm digital atmosphere
The UI should feel soft and human, without becoming decorative or childish.

### 3.6 Minimal chrome
Avoid thick borders, dense toolbars, dashboard widgets, and excessive labels.

### 3.7 Search as the primary hero
Search should visually anchor both the mobile and web experience.

---

## 4. Brand personality

The product should feel:

- Reflective
- Curious
- Personal
- Calm
- Intelligent
- Visual
- Youthful
- Organized without looking rigid

The product should not feel:

- Corporate
- Technical
- Loud
- Gamified
- E-commerce-heavy
- Like an Instagram clone
- Like Pinterest with renamed features
- Like a generic AI dashboard
- Like a file manager

---

## 5. Color system

### 5.1 Main application palette

| Token | Hex | Usage |
|---|---:|---|
| `canvas` | `#F4F5F8` | Main archive surface |
| `canvas-warm` | `#F7F4F1` | Warm alternate surface |
| `surface` | `#FFFFFF` | Cards, panels, modals |
| `surface-soft` | `#FAFAFC` | Inputs and quiet controls |
| `text-primary` | `#20232B` | Main text |
| `text-secondary` | `#747986` | Supporting metadata |
| `text-tertiary` | `#A0A5B0` | Quiet labels |
| `border-soft` | `#E6E8EE` | Dividers and card outlines |
| `accent-indigo` | `#7782C8` | Primary interaction color |
| `accent-indigo-soft` | `#ECEEFA` | Selected states |
| `accent-coral` | `#E9877E` | Save confirmation and warmth |
| `accent-peach` | `#F3B49E` | Atmospheric gradient |
| `accent-lilac` | `#B9A8D4` | Atmospheric gradient |
| `accent-blue` | `#AFC6E3` | Atmospheric gradient |
| `success` | `#5D9278` | Available/complete |
| `warning` | `#C39457` | Incomplete metadata |
| `danger` | `#B85D62` | Deleted/unavailable |
| `dark-canvas` | `#17181C` | Dark mode background |
| `dark-surface` | `#23252B` | Dark cards |

### 5.2 Atmospheric gradient

Use a blurred ambient gradient outside or behind the main content surface:

```css
background:
  radial-gradient(circle at 10% 20%, rgba(175,198,227,.78), transparent 32%),
  radial-gradient(circle at 42% 10%, rgba(243,180,158,.78), transparent 34%),
  radial-gradient(circle at 70% 18%, rgba(185,168,212,.72), transparent 36%),
  radial-gradient(circle at 92% 8%, rgba(233,135,126,.48), transparent 30%),
  #F4F5F8;
```

Rules:

- The gradient must be heavily blurred.
- It should create atmosphere, not become a visible rainbow.
- The content board remains primarily white or pale grey.
- Do not place bright gradients inside every card.
- Do not use Instagram’s pink-orange-purple gradient.

### 5.3 Category color behavior

Categories should use muted tints, not saturated badges.

Examples:

| Category | Background | Text |
|---|---|---|
| Fashion | `#F2E8EC` | `#76515E` |
| Study | `#E9EEF7` | `#516A8A` |
| Courses | `#EEE9F5` | `#67577C` |
| Food | `#F5ECE2` | `#7A604A` |
| Travel | `#E8F1EF` | `#4F746B` |
| Technology | `#E9EDF2` | `#546475` |

---

## 6. Typography

### 6.1 Typeface system

#### Editorial display
Use one of:

- Instrument Serif
- Cormorant Garamond
- Newsreader

Recommended: **Instrument Serif**

Use it for:

- Search hero placeholder on desktop
- Month titles
- Empty-state statements
- Collection cover titles
- Selected editorial moments

#### Functional interface
Use one of:

- Inter
- Geist
- Manrope

Recommended: **Inter**

Use it for:

- Navigation
- Buttons
- Metadata
- Forms
- Filters
- Card labels
- Settings
- Mobile search input

### 6.2 Type scale

| Role | Desktop | Mobile |
|---|---|---|
| Hero search text | 54/1.1 | 34/1.15 |
| Page title | 38/1.15 | 30/1.2 |
| Month title | 30/1.15 | 25/1.2 |
| Section title | 20/1.3 | 18/1.3 |
| Card title | 15/1.35 | 14/1.35 |
| Body | 15/1.55 | 15/1.5 |
| Metadata | 12/1.4 | 12/1.4 |
| Micro label | 10/1.35 | 10/1.35 |

### 6.3 Typography rules

- Editorial serif should be used sparingly.
- Never use a script font.
- Avoid excessive italics.
- Card titles should normally remain sans-serif.
- Date headings can use the serif to strengthen memory and chronology.
- Do not use all caps for large headings.
- Tiny navigation labels may use uppercase with increased letter spacing.

---

## 7. Layout system

### 7.1 Desktop application shell

The desktop UI should feel like a board floating inside a soft atmospheric environment.

#### Outer frame
- Ambient pastel background
- 24–48px safe space around the application board
- Optional subtle browser-like top strip for the marketing demo only
- Production app should use a clean native application shell

#### Main board
- White or `canvas` surface
- Maximum width: 1500px
- Minimum side padding: 32px
- Large-screen side padding: 56px
- Border radius: 22–28px when shown as a floating board
- Very soft shadow
- Do not use a heavy card outline

#### Sidebar
- Width: 72px collapsed
- Width: 224px expanded
- Low-contrast
- Icon-first
- Vertical product wordmark can be used only in the collapsed desktop rail
- Primary action must remain obvious

### 7.2 Mobile application shell

- Full-screen canvas
- No decorative floating browser frame
- 16px horizontal page padding
- 12px content gap
- Sticky search header
- Bottom navigation
- Central save action
- Content begins close to the top; avoid oversized empty hero areas

### 7.3 Grid system

#### Desktop masonry
- CSS columns or a layout engine that preserves visual order acceptably
- 5 columns at very large widths
- 4 columns on standard desktop
- 3 columns on compact laptop
- 18px horizontal gap
- 18px vertical gap

#### Tablet
- 3 columns
- 16px gaps

#### Mobile
- 2 columns
- 10–12px gaps
- Optional single-column mode for accessibility or compact list preference

### 7.4 Masonry discipline

Use varied card heights, but only from a controlled set:

- Short: 0.78 ratio
- Standard: 1.00 ratio
- Portrait: 1.28 ratio
- Tall editorial: 1.55 ratio

Do not allow unlimited unpredictable height. Excessive irregularity makes date scanning harder.

---

## 8. Search experience

Search is the main visual anchor.

### 8.1 Desktop hero search

Placement:
- Top of the archive
- Full content width
- 68–88px height
- Minimal underline or border-bottom
- Editorial serif placeholder

Suggested placeholder:

> Search what you remember...

Alternative rotating suggestions:

- “black dress from last month”
- “course sent during exams”
- “that cafe reel from June”
- “creator with the skincare link”

Elements:
- Large search icon at the right
- `/` keyboard shortcut hint
- Filter access appears only after focus or below the field

### 8.2 Mobile search

- Sans-serif for readability
- 52–56px height
- Rounded 18px container
- Sticky below top header
- Search icon
- Optional voice search later
- Filter icon at the far right

### 8.3 Search result behavior

- Preserve the visual masonry layout by default
- Highlight matched title or metadata subtly
- Show the interpreted date filter
- Allow switching to compact list
- Avoid replacing all cards with uniform search rows

---

## 9. Card system

Cards are the primary visual language.

### 9.1 Universal card rules

- White or image-dominant background
- 14–18px radius
- Minimal border
- Soft hover elevation on web
- No deep drop shadows
- Content clipping must respect radius
- Touch targets remain at least 44px
- Essential data should never be hover-only

### 9.2 Reel memory card

Primary card for the application.

Structure:

```text
┌─────────────────────────┐
│                         │
│      Reel thumbnail     │
│                         │
│                    ↗    │
├─────────────────────────┤
│ Product or idea title   │
│ @creator · 12 Jul       │
│ Fashion         • Saved │
└─────────────────────────┘
```

Rules:

- Thumbnail occupies 68–78% of visual height.
- Title limited to two lines.
- Creator and date use muted metadata.
- Category appears as a quiet text chip.
- Link domain may appear only on expanded cards or detail view.
- Use a small status dot rather than a large banner.

### 9.3 Image-only memory card

Used when the thumbnail itself is enough.

- Image fills card
- Bottom gradient only if metadata overlays the image
- Title appears on hover/web or below image/mobile
- Never place large opaque text boxes over the image

### 9.4 Editorial text card

Used for course notes, quotes, reminders, or saved captions.

- Warm white background
- Generous padding
- Serif headline or quotation
- Small source label
- Controlled height
- Avoid imitating paper with fake tears, tape, or excessive skeuomorphism

### 9.5 Link article card

- Editorial screenshot or Open Graph image
- Publication/domain
- Headline
- Saved date
- Compact format

### 9.6 List/checklist card

Useful for saved itineraries, study resources, or grouped links.

- Muted colored background
- 3–5 visible checklist rows
- Remaining count shown at bottom
- Not every saved link should become a checklist

### 9.7 Deleted reel card

The saved memory must remain useful.

Visual behavior:
- Keep the original thumbnail
- Reduce saturation slightly
- Add a small `Reel deleted` badge
- Destination link remains active when available
- Do not cover the full thumbnail with a dark error state

### 9.8 Incomplete card

- Neutral dashed metadata area
- Message: `Add reel thumbnail`
- One direct action
- Avoid red error styling

---

## 10. Desktop home screen

### 10.1 Structure

```text
┌──────────────────────────────────────────────────────────────┐
│ Side rail │ Search what you remember...               Search │
│           ├───────────────────────────────────────────────────┤
│           │ Today   This week   July   All dates   Filters    │
│           │                                                   │
│           │ JULY 2026                                        │
│           │ [card] [card] [card] [card] [card]               │
│           │ [card] [card] [card] [card] [card]               │
│           │                                                   │
└──────────────────────────────────────────────────────────────┘
```

### 10.2 Sidebar items

Collapsed rail:
- Home
- Search
- Save
- Collections
- Shared
- Archive
- Settings
- Profile

Use simple line icons. The active item uses a soft tinted circular background.

### 10.3 Timeline headers

Use:
- Instrument Serif
- Muted charcoal
- Month and year
- Small item count
- Optional divider extending across the remaining width

Example:

> July 2026  
> 24 memories

---

## 11. Mobile home screen

### 11.1 Header

```text
Your archive                         avatar
Things worth finding again
```

Use:
- Small functional heading
- Editorial supporting line
- No forced greeting every time

### 11.2 Search

```text
[ Search what you remember...        ]
```

### 11.3 Date rail

```text
Today   This week   July   Calendar
```

- Horizontally scrollable
- Selected item uses indigo-soft background
- No saturated pills

### 11.4 Timeline grid

- Month heading
- Two-column masonry
- Thumbnails dominate
- Cards can alternate between standard and portrait heights
- Avoid more than one text-only card per viewport where possible

### 11.5 Bottom navigation

```text
Home     Search       Save       Collections     Profile
```

Save button:
- Slightly larger
- Circular or rounded-square
- Indigo fill
- Subtle coral confirmation animation after save
- Not a large floating button obstructing content

---

## 12. Save composer

### 12.1 Visual approach

The save flow should feel like adding something to a personal board, not completing a form.

### 12.2 Mobile save sheet

```text
┌──────────────────────────────┐
│ Add to your archive       ×  │
│                              │
│ [ Thumbnail preview       ]  │
│                              │
│ Title                        │
│ [ Detected title          ]  │
│                              │
│ Category    Collection       │
│ [ Fashion ] [ Wishlist ]     │
│                              │
│ instagram.com → store.com    │
│                              │
│ [ Save memory ]              │
│ More details                 │
└──────────────────────────────┘
```

Rules:

- Large thumbnail preview
- Only essential fields visible
- Advanced fields collapsed
- One primary CTA
- Metadata extraction runs asynchronously
- User can save without waiting

### 12.3 Save success state

Use:
- Brief card-placement animation
- Small haptic event
- Copy: `Saved to your archive`
- Secondary action: `Add to collection`

Do not use confetti.

---

## 13. Item detail screen

### 13.1 Mobile

- Edge-to-edge or large thumbnail
- Title
- Creator
- Date saved
- Open link primary CTA
- View original reel secondary CTA
- Notes
- Category and collection
- Status
- Related items
- Edit and share actions

### 13.2 Desktop

Use a right-side detail panel:

- Width: 420–500px
- Main board remains visible behind it
- Thumbnail at top
- Sticky action area
- Escape closes panel
- Direct URL opens a full-page version

---

## 14. Collections

Collections should resemble curated mini moodboards.

### Collection card
- Four-image collage or one dominant cover
- Editorial serif title
- Small item count
- Private/shared state
- No folder icon as the primary visual

### Collection detail
- Large title
- Optional subtitle
- Curated masonry board
- Share controls remain secondary
- Reordering should feel direct and visual

---

## 15. Empty states

Avoid generic illustrations.

### New user
Editorial copy:

> Your links should not disappear into an inbox.

Supporting text:

> Save your first Instagram find and it will appear here with its reel, date, and link.

Primary action:
`Save your first link`

### No search results

> Nothing matches that memory yet.

Suggested actions:
- Remove date filter
- Search creator name
- Search the product type

### Empty collection

> This collection is waiting for its first find.

---

## 16. Interaction and motion

### Motion language
- Slow enough to feel refined
- Fast enough to remain functional
- Mostly opacity, translation, and subtle scale

### Timing
- Hover: 140–180ms
- Standard transition: 200–240ms
- Drawer/panel: 260–320ms
- Card placement: 300–380ms

### Card interactions
Desktop:
- Translate upward by 2–4px
- Slight shadow increase
- Reveal compact actions

Mobile:
- Long press for multi-select
- No hover-dependent behavior
- Swipe actions should be optional, not required

### Reduced motion
- Disable card lift
- Replace animated placement with fade
- Avoid parallax and continuous gradient animation

---

## 17. Iconography

Use:
- Lucide
- Phosphor
- Custom icon set only after brand maturity

Style:
- Thin to regular stroke
- Rounded corners
- 18–22px default size
- Quiet neutral color

Avoid:
- Filled cartoon icons
- Mixed icon libraries
- Instagram-style glyph mimicry
- Excessive icon labels

---

## 18. Imagery and thumbnails

### Thumbnail treatment
- Preserve original aspect ratio where possible
- Crop intentionally using focal point
- Use `object-fit: cover`
- Never stretch
- Apply subtle placeholder background while loading

### Missing thumbnail
Use:
- Domain-based abstract gradient
- Large initial or simple category icon
- Title remains readable
- User can replace it later

### Image quality
- Generate multiple thumbnail sizes
- Use responsive formats
- Prefer AVIF/WebP
- Blur-up loading
- Remove unnecessary metadata from user uploads

---

## 19. Responsive rules

### Breakpoints
- Small mobile: `< 390px`
- Mobile: `390–767px`
- Tablet: `768–1023px`
- Laptop: `1024–1279px`
- Desktop: `1280–1599px`
- Wide: `1600px+`

### Grid response
- Small mobile: 2 narrow columns or optional 1 column
- Mobile: 2 columns
- Tablet: 3 columns
- Laptop: 3–4 columns
- Desktop: 4–5 columns
- Wide: maximum 5 columns; do not stretch cards indefinitely

### Sidebar response
- Desktop: persistent
- Tablet: collapsible rail
- Mobile: bottom navigation

---

## 20. Accessibility

- Minimum WCAG AA contrast for functional text
- Decorative serif text must remain legible
- Minimum 44x44px touch targets
- Full keyboard support on web
- Screen reader descriptions for thumbnails
- Visible focus ring using accent indigo
- Category and status never communicated by color alone
- User-controlled reduced motion
- User-controlled grid/list preference
- Dynamic text support on mobile
- Do not lock card height when larger text is enabled

---

## 21. Dark mode

Dark mode should remain editorial, not neon.

### Palette
- Background: `#15161A`
- Board: `#1C1E23`
- Surface: `#24272E`
- Primary text: `#F1F2F4`
- Secondary text: `#A8ADB8`
- Border: `#333740`
- Accent: `#959FE1`

Rules:
- Reduce atmospheric gradient opacity
- Preserve image color
- Avoid pure black
- Cards should use subtle borders rather than strong shadows

---

## 22. Design tokens

```ts
export const colors = {
  canvas: "#F4F5F8",
  canvasWarm: "#F7F4F1",
  surface: "#FFFFFF",
  surfaceSoft: "#FAFAFC",
  textPrimary: "#20232B",
  textSecondary: "#747986",
  textTertiary: "#A0A5B0",
  borderSoft: "#E6E8EE",
  accentIndigo: "#7782C8",
  accentIndigoSoft: "#ECEEFA",
  accentCoral: "#E9877E",
  accentPeach: "#F3B49E",
  accentLilac: "#B9A8D4",
  accentBlue: "#AFC6E3",
  success: "#5D9278",
  warning: "#C39457",
  danger: "#B85D62",
};

export const radius = {
  control: 12,
  input: 16,
  card: 18,
  mediaCard: 20,
  panel: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};
```

---

## 23. Component inventory

### Navigation
- Desktop side rail
- Expanded sidebar
- Mobile bottom navigation
- Profile menu
- Breadcrumbs for management views

### Search
- Hero search
- Mobile sticky search
- Date rail
- Filter drawer
- Search suggestions
- Recent searches
- Result count

### Cards
- Reel memory card
- Image-only card
- Editorial text card
- Article card
- Checklist card
- Deleted reel card
- Incomplete metadata card
- Collection card

### Save flow
- Share-intent preview
- Link parser state
- Thumbnail picker
- Category selector
- Collection selector
- Advanced details accordion
- Save confirmation

### Detail
- Media preview
- Metadata block
- Link action group
- Notes editor
- Status indicator
- Related items
- Share menu

### Feedback
- Toast
- Skeleton
- Empty state
- Inline error
- Offline state
- Undo bar

---

## 24. Figma page structure

```text
00 — Cover
01 — Foundations
02 — Colors
03 — Typography
04 — Spacing and Grid
05 — Components
06 — Mobile / Onboarding
07 — Mobile / Home
08 — Mobile / Save Flow
09 — Mobile / Search
10 — Mobile / Item Detail
11 — Mobile / Collections
12 — Web / Home
13 — Web / Search
14 — Web / Item Detail
15 — Web / Collections
16 — Web / Settings
17 — States and Errors
18 — Prototype Flows
19 — Handoff
```

---

## 25. Required primary screens

### Mobile
1. Splash
2. Onboarding
3. Authentication
4. Permission explanation
5. Home archive
6. Search
7. Filter sheet
8. Share-intent composer
9. Manual save
10. Save success
11. Item detail
12. Item edit
13. Collections
14. Collection detail
15. Notifications
16. Profile
17. Subscription
18. Settings
19. Archive
20. Trash

### Web
1. Authentication
2. Home archive
3. Search results
4. Item side panel
5. Full item page
6. Collections
7. Shared collection
8. Archive
9. Trash
10. Account settings
11. Export
12. Subscription
13. Admin panel

---

## 26. Prohibited design decisions

Do not use:

- Instagram gradients as the main identity
- A uniform dashboard card grid
- Thick black borders
- Glassmorphism on every surface
- Neon colors
- Oversized floating action buttons
- Heavy drop shadows
- Fake paper tape and torn edges
- Too many serif fonts
- Script fonts
- Excessive rounded pills
- Category colors that overpower thumbnails
- Three-dimensional icons
- AI sparkle icons as decoration
- Dense metadata visible on every card
- Auto-playing reel previews in the archive
- Horizontal scrolling for the main content grid
- Random masonry heights without constraints

---

## 27. Final design rule

The strongest version of ReelRecall should look like a personal editorial archive that happens to be highly searchable.

The visual design should make the user think:

> “I remember this.”

before they need to read:

> “I saved this on July 12 at 8:34 PM.”
