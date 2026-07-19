# Build Prompt for an AI Coding Agent

You are building a production-quality, mobile-first application called ReelRecall. The product helps users save, organize, search, and rediscover destination links received through Instagram chatbot DMs.

## Product objective
A user should be able to explicitly share or paste a chatbot DM, detect its URL, attach the original reel reference or thumbnail, and save it in under 10 seconds. The saved item should later be searchable by title, creator, date, category, notes, and domain.

## Platforms
- React Native mobile app using Expo and TypeScript
- Next.js App Router web app using TypeScript
- Shared packages in a Turborepo
- Supabase for PostgreSQL, authentication, row-level security, and storage

## Core constraints
- Do not scrape private Instagram DMs.
- Do not request Instagram credentials.
- Mobile capture must use share intent, paste, clipboard confirmation, or screenshot upload.
- Saving must not depend on successful metadata extraction.
- Metadata extraction must run asynchronously.
- Preserve user data when reels or destination pages disappear.
- Apply strict authorization and row-level security.
- Do not store full reel videos.

## Required modules
1. Authentication
2. Onboarding
3. Mobile share intent
4. URL parser
5. Save composer
6. Metadata extraction jobs
7. Visual timeline
8. Search and date filters
9. Item detail and edit
10. Categories
11. Collections
12. Shared collection links
13. Archive and trash
14. Reel availability status
15. Notifications
16. Account export and deletion
17. Admin operations
18. Analytics and error monitoring

## Visual direction
Use a soft editorial digital scrapbook style:
- Warm off-white background
- White cards
- Charcoal text
- Soft electric violet primary accent
- Coral reserved for important actions
- Rounded visual cards
- Strong thumbnail hierarchy
- Two-column mobile grid
- Clean web sidebar and responsive management views

## Engineering standards
- Strict TypeScript
- Schema validation
- Typed database access
- Reusable components
- Accessible interactions
- Secure URL handling
- SSRF protection
- Image validation
- Idempotent save requests
- Background job retries
- Unit, integration, and end-to-end tests
- Structured logging
- Sentry
- PostHog

## Implementation order
1. Monorepo and design tokens
2. Authentication and database
3. Manual save
4. Mobile share intent
5. Metadata jobs
6. Timeline and item detail
7. Search and date filtering
8. Collections
9. Web management
10. Sharing
11. Reel status checks
12. Security, accessibility, and release hardening

Do not overbuild social features, monetization, or AI chat before capture and retrieval work reliably.
