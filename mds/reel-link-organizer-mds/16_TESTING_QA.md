# Testing and QA

## Test layers
- Unit tests
- API integration tests
- Database policy tests
- Mobile component tests
- Web component tests
- End-to-end tests
- Accessibility tests
- Security tests
- Device testing

## Critical end-to-end scenarios
1. User shares a chatbot message containing one destination URL.
2. User shares text containing both an Instagram reel URL and a destination URL.
3. User copies a link and accepts the clipboard save prompt.
4. User saves without a thumbnail.
5. User uploads a screenshot as thumbnail.
6. Metadata extraction fails but item still saves.
7. User finds an item by title.
8. User finds an item by month.
9. User filters by creator.
10. User adds item to collection.
11. User shares and revokes a collection.
12. Reel status changes to deleted.
13. User deletes and restores an item.
14. User exports data.
15. User deletes account.

## Mobile matrix
- Recent iPhone models
- One older supported iPhone
- Pixel reference device
- Samsung mid-range device
- Small Android screen
- Low-memory Android device

## Web matrix
- Chrome
- Safari
- Edge
- Firefox
- Tablet browser
- Mobile browser

## Performance budgets
- Save composer interactive quickly after share intent
- Home screen first meaningful content under reasonable network conditions
- Images lazy-loaded
- Thumbnails compressed
- Search response target under 500ms for common queries
- Avoid blocking save on metadata extraction

## Accessibility QA
- Screen reader navigation
- Keyboard-only desktop navigation
- Contrast checks
- Dynamic text
- Focus order
- Error announcement
- Reduced motion

## Security QA
- Authorization bypass attempts
- Shared link guessing
- SSRF attempts
- Malicious URL schemes
- Oversized upload
- MIME spoofing
- Rate-limit abuse
- Deleted-account data access
