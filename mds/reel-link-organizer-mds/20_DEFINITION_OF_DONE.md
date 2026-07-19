# Definition of Done

## Product
- Core user can save an Instagram chatbot link in under 10 seconds.
- User can save even when metadata extraction fails.
- User can search by date and text.
- User can recognize items visually.
- Item detail preserves reel and destination context.
- Collections can remain private or be shared.
- Reel deletion does not remove saved context.

## Mobile
- Share intent works on supported iOS and Android versions.
- Clipboard flow is permission-safe.
- All primary screens support small devices.
- Offline or unstable-network behavior is handled.
- App meets accessibility baseline.

## Web
- Responsive library
- Search and filters
- Bulk management
- Collection sharing
- Account and export settings
- Keyboard accessibility

## Backend
- Authorization tests pass.
- Row-level security verified.
- Jobs are retryable.
- Save endpoint is idempotent.
- URLs are normalized safely.
- Uploads are validated and re-encoded.
- Audit logs exist for admin actions.

## Quality
- No critical crashes.
- No known high-severity security issue.
- Performance budgets met.
- Error reporting enabled.
- Privacy policy and terms available.
- Account export and deletion tested.

## Release readiness
- App icons and store assets
- Production analytics
- Crash monitoring
- Support email
- Incident process
- Database backups
- Rollback plan
- Staged rollout
