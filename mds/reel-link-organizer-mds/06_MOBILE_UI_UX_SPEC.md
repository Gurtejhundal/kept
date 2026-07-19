# Mobile UI/UX Specification

## Design direction
Soft editorial visual archive with disciplined productivity patterns.

The interface should feel:
- Visual
- Calm
- Personal
- Fast
- Modern
- Youthful without becoming childish

The interface should not feel:
- Like Instagram
- Like Pinterest copy
- Like a corporate CRM
- Like a notes app
- Like a generic AI dashboard

## Home screen

### Header
- Small greeting
- Strong page title: “Your saved finds”
- Profile avatar
- Notification icon

### Search
Large rounded search field:
“Search by title, creator, or date”

### Date shortcuts
Horizontal chips:
- Today
- This week
- This month
- Choose date

### Timeline sections
Example:
- TODAY — 4 SAVED
- JULY 2026 — 18 SAVED

### Card grid
- Two-column grid
- Consistent base aspect ratio
- 16px outer margin
- 12px grid gap
- 18–22px card radius
- Thumbnail occupies approximately 68% of card
- Text limited to two lines
- Creator and date in compact metadata row

## Bottom navigation
- Home
- Search
- Central Save action
- Collections
- Profile

The Save action should appear visually stronger than the other navigation items.

## Save composer
Use a bottom sheet or full-screen sheet depending on content.

### Visible by default
- Thumbnail
- Title
- Category
- Collection
- Destination link summary
- Save button

### Collapsed advanced fields
- Reel URL
- Creator
- Notes
- Tags
- Received date
- Custom thumbnail

## Search screen
- Persistent search field
- Recent searches
- Date picker
- Suggested categories
- Filter button
- Results displayed visually
- Empty state with specific guidance

## Item detail
- Large thumbnail
- Title and creator
- Open link primary CTA
- Original reel secondary CTA
- Date and time
- Category
- Collection
- Notes
- Status
- Action menu

## Collections
- Cover collage generated from first four items
- Collection title
- Item count
- Private/shared badge
- Last updated date

## Interaction details
- Haptic feedback on save
- Swipe actions only for optional shortcuts
- Long press for multi-select
- Skeleton loading states
- Optimistic save UI
- Undo after archive or delete
- Preserve scroll position after opening an item

## Accessibility
- Minimum touch target: 44x44 points
- Dynamic type support
- Screen reader labels
- Visible focus indicators
- Do not rely only on color for status
- Reduced motion support
