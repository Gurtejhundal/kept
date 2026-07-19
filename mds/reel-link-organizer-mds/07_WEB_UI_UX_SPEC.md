# Web UI/UX Specification

## Purpose of the web application
The web application is optimized for:
- Reviewing a larger library
- Bulk organization
- Editing metadata
- Managing collections
- Sharing collections
- Exporting data

Mobile remains the primary capture surface.

## Desktop layout
- Fixed left navigation: 232–260px
- Center content column
- Optional right detail panel on large screens
- Maximum content width around 1440px
- Responsive collapse below tablet breakpoint

## Home
- Page title and date context
- Search and filter toolbar
- Grid/list density control
- Timeline grouping
- Bulk selection
- Drag items into collections where practical

## Card views

### Visual grid
Best for recall:
- 3–6 columns depending on width
- Consistent image proportions
- Hover reveals actions
- Do not hide essential metadata behind hover

### Compact list
Best for management:
- Thumbnail
- Title
- Creator
- Category
- Save date
- Domain
- Status
- Collection

## Item detail
On desktop, open in a right-side panel when accessed from a library grid. Provide a full-page route for direct links and sharing.

## Search experience
- Search-as-you-type with debounce
- Keyboard shortcut: `/`
- Filter bar
- Date range picker
- Saved searches after MVP
- Search result count
- Sort controls

## Bulk operations
- Add to collection
- Change category
- Archive
- Delete
- Export
- Mark metadata complete

## Responsive behavior
- Desktop sidebar converts to drawer below 1024px
- Grid reduces columns fluidly
- Right detail panel becomes modal or full page
- Bottom navigation may appear on small web widths for consistency
