# Edge Cases and Failure Handling

## Capture
- Shared message contains no URL
- Shared message contains shortened URL
- Shared message contains multiple product links
- Shared message contains only reel URL
- User shares an image instead of text
- Instagram share sheet omits message body
- Clipboard permission denied
- Duplicate save
- Offline save attempt

## Metadata
- Destination page blocks crawlers
- Open Graph image missing
- Title is meaningless
- Link redirects multiple times
- Redirect loops
- Content requires login
- Link expires
- Page is removed
- Domain is unsafe

## Reel
- Reel is private
- Reel requires login
- Reel deleted before first check
- Creator changes username
- Reel URL format changes
- Status cannot be determined
- Thumbnail retrieval not permitted

## Search
- Misspelled creator name
- Empty search
- Very large library
- Date timezone mismatch
- User saved item after midnight but mentally associates it with previous day
- Multiple items with same title

## Collections
- Shared collection later made private
- Shared item deleted
- Collection owner deletes account
- Duplicate item added
- Reordering conflicts across devices

## Subscription
- Store purchase pending
- Purchase restored
- Subscription expires offline
- User has web and mobile entitlements
- Billing provider outage

## Account
- Email change
- Lost device
- Multiple active sessions
- Account deletion reversal window
- Export generation failure

## Required UX pattern
Every recoverable failure should offer a next action:
- Retry
- Save anyway
- Edit manually
- Upload thumbnail
- Copy diagnostic ID for support
