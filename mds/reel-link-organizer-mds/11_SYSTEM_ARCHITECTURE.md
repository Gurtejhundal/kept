# System Architecture

## Recommended architecture
A TypeScript monorepo provides the best balance between shared logic, speed, and maintainability.

## Monorepo structure
```text
apps/
  mobile/
  web/
  api-or-workers/
packages/
  ui/
  design-tokens/
  database/
  auth/
  validation/
  url-parser/
  search/
  analytics/
  config/
```

## Mobile
- Expo
- React Native
- Expo Router
- Native share extension or share intent integration
- Secure storage for tokens
- Image picker and upload
- Deep links

## Web
- Next.js App Router
- Server components where appropriate
- Route handlers or dedicated API
- Responsive interface
- Public collection routes
- Account and subscription management

## Backend
Option A: Supabase-first architecture
- PostgreSQL
- Authentication
- Row-level security
- Object storage
- Edge Functions
- Realtime only where useful

Option B: Dedicated API
- NestJS or Fastify
- PostgreSQL
- S3 storage
- Redis queue

For the first release, Supabase-first is faster and less operationally expensive.

## Background processing
Use jobs for:
- Metadata extraction
- Thumbnail fetching
- Link normalization
- Reel availability checks
- Weekly resurfacing notifications
- Export generation
- Duplicate detection

## Storage
Store:
- User-uploaded thumbnails
- Derived thumbnails when licensing and technical conditions allow
- Export files temporarily
- Profile images

Do not store full Instagram reel videos.

## Search
Phase 1:
- PostgreSQL full-text search
- Trigram similarity
- Structured filters

Phase 2:
- Embeddings for semantic search
- OCR index from screenshots
- Natural-language date interpretation

## Observability
- Sentry for errors
- PostHog for product analytics
- Structured logs
- Job failure dashboard
- Uptime monitoring

## Deployment
- Web: Vercel
- Database/Auth/Storage: Supabase
- Workers: Supabase Edge Functions, Trigger.dev, or Railway
- Mobile builds: Expo EAS

## Reliability principles
- Item creation must succeed even if metadata extraction fails.
- Metadata enrichment must be asynchronous.
- Save operations must be idempotent.
- Duplicate requests must not create accidental repeated items unless the user confirms.
