# Security and Privacy

## Privacy position
The product stores personal link history and may contain sensitive browsing intent. Privacy must be treated as a core product feature.

## Data minimization
Store only what is required:
- Shared message text only when necessary
- URLs
- User-provided thumbnail
- Extracted metadata
- User notes
- Save timestamps

Do not store entire Instagram conversations.

## Instagram constraints
- Do not scrape private DMs.
- Do not request Instagram passwords.
- Do not present the product as officially affiliated with Instagram.
- Respect platform terms and technical access restrictions.
- Use explicit user sharing or copy/paste.

## Authentication security
- Secure token storage on mobile
- HTTP-only secure cookies on web
- Multi-factor authentication optional later
- Session revocation
- Login alerts for suspicious activity

## Authorization
- Server-side ownership checks
- Row-level security
- Separate public read model for shared collections
- Share tokens must be revocable
- Avoid guessable share URLs

## URL safety
- Validate protocols
- Block `javascript:` and local file schemes
- Detect suspicious domains
- Use safe redirect handling
- Do not server-fetch private network addresses
- Protect against SSRF
- Apply fetch timeouts and size limits

## File upload safety
- Allow only expected image MIME types
- Verify actual file signature
- Limit image size
- Re-encode images
- Strip unnecessary metadata
- Virus scan where infrastructure permits

## Account controls
- Export data
- Delete account
- Delete individual items
- Revoke shared links
- Clear search history
- Manage notification permissions

## Retention
- Trash retention period: 30 days
- Deleted accounts enter a short recovery window if legally permitted
- Derived metadata deleted with the source item
- Temporary export files expire automatically

## Compliance preparation
- Privacy policy
- Terms of service
- Data processing inventory
- Incident response process
- Consent records for notifications and analytics
- Age policy suitable for the target market
