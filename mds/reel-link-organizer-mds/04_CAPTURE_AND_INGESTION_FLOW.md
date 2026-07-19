# Capture and Ingestion Flow

## Critical constraint
Instagram does not provide a simple consumer-facing mechanism for an unrelated third-party app to continuously read a user's private DMs. The product must therefore rely on explicit user action.

## Recommended capture method
The strongest first-version capture method is the operating system share sheet.

### Mobile flow
1. User opens the chatbot DM in Instagram.
2. User copies the message or link.
3. User taps Share where Instagram permits it, or copies the content.
4. User selects ReelRecall from the native share sheet.
5. ReelRecall opens a compact save sheet.
6. The app parses all URLs.
7. The app proposes:
   - Destination link
   - Original reel link, if present
   - Creator, if detectable
   - Suggested title
   - Suggested category
8. User optionally adds a thumbnail or reel screenshot.
9. User taps Save.

### Clipboard fallback
When the user opens ReelRecall after copying content:
- Detect a new URL in clipboard only after user permission.
- Show a non-blocking banner: “Save copied Instagram link?”
- Never continuously monitor the clipboard in the background.
- Never save clipboard content without confirmation.

### Screenshot-assisted fallback
When only the visual reel reference is available:
1. User uploads a screenshot.
2. App stores the screenshot as the thumbnail.
3. OCR may extract creator name or visible text.
4. User pastes the destination link.
5. App completes metadata extraction.

### Manual save fallback
- Paste destination link
- Paste reel URL
- Upload thumbnail
- Add title
- Select category

## Save sheet requirements
The first screen must contain:
- Thumbnail preview
- Detected title
- Category
- Collection
- Destination domain
- Save button

Advanced fields remain collapsed.

## URL parsing rules
- Extract all URLs from shared text.
- Normalize tracking parameters.
- Preserve original URL separately.
- Detect Instagram reel URLs.
- Detect redirect links.
- Resolve safe redirects server-side where allowed.
- Warn before opening suspicious domains.
- Do not silently execute arbitrary links.

## Capture failure states
- No URL found
- Multiple links found
- Unsupported Instagram share format
- Metadata fetch blocked
- Reel is private
- Reel deleted
- Destination URL expired
- Screenshot has no readable metadata

## Decision rule
Do not force the user to provide both the reel URL and destination URL. Save partial information and allow completion later.
