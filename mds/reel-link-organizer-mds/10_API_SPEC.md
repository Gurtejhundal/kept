# API Specification

## API principles
- Version routes under `/api/v1`
- Use JSON
- Validate all inputs
- Return stable error codes
- Enforce ownership server-side
- Apply rate limiting
- Never trust client-generated user IDs

## Authentication
Handled through secure session cookies on web and token-based sessions on mobile.

## Saved items

### POST `/api/v1/items`
Create an item.

Request:
```json
{
  "destinationUrl": "https://example.com/product",
  "originalReelUrl": "https://instagram.com/reel/...",
  "sourceMessageText": "Here is your link...",
  "thumbnailUploadId": "optional",
  "title": "optional",
  "categoryId": "optional",
  "collectionIds": [],
  "receivedAt": "optional ISO date"
}
```

Response:
```json
{
  "item": {},
  "metadataJobQueued": true
}
```

### GET `/api/v1/items`
Query parameters:
- q
- category
- collection
- creator
- reelStatus
- dateFrom
- dateTo
- sort
- cursor
- limit

### GET `/api/v1/items/:id`
Returns complete item details.

### PATCH `/api/v1/items/:id`
Update editable fields.

### DELETE `/api/v1/items/:id`
Soft-delete item.

### POST `/api/v1/items/:id/archive`
Archive item.

### POST `/api/v1/items/:id/restore`
Restore from trash or archive.

## Ingestion

### POST `/api/v1/ingest/parse`
Parse shared text and links.

Request:
```json
{
  "text": "shared text",
  "urls": [],
  "source": "ios_share_sheet"
}
```

Response:
```json
{
  "detectedLinks": [],
  "suggestedReelUrl": null,
  "suggestedDestinationUrl": null,
  "suggestedCreator": null
}
```

### POST `/api/v1/ingest/metadata`
Queue metadata extraction.

## Search

### GET `/api/v1/search`
Parameters:
- q
- dateFrom
- dateTo
- category
- creator
- domain
- status
- cursor

## Collections

### POST `/api/v1/collections`
Create collection.

### GET `/api/v1/collections`
List collections.

### GET `/api/v1/collections/:id`
Return collection and items.

### PATCH `/api/v1/collections/:id`
Update collection.

### DELETE `/api/v1/collections/:id`
Archive or delete collection.

### POST `/api/v1/collections/:id/items`
Add items.

### DELETE `/api/v1/collections/:id/items/:itemId`
Remove item.

### POST `/api/v1/collections/:id/share`
Create share link.

### DELETE `/api/v1/collections/:id/share`
Revoke share link.

## Link and reel checks

### POST `/api/v1/items/:id/check`
Queue availability check.

### GET `/api/v1/items/:id/checks`
Return check history for authorized user.

## Export

### POST `/api/v1/export`
Queue JSON or CSV export.

## Error format
```json
{
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "The saved item could not be found.",
    "fieldErrors": {}
  }
}
```
