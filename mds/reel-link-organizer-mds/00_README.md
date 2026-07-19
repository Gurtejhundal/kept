# Reel Link Organizer — Master Development Specification

## Project status
Concept-stage product specification for a mobile-first application and companion web application that helps users save, organize, search, and rediscover links received through Instagram chatbot DMs.

## Core problem
Users engage with an Instagram reel, comment a keyword, and receive a product or resource link through an automated Instagram DM. The message is technically delivered, but the user later remembers only the reel visual or approximate date. Instagram inbox search and message organization are too weak for this recall pattern.

## Product thesis
The product should not behave like a traditional bookmark manager. It should behave like a visual memory archive where each saved item is connected to:

- Original reel reference
- Reel thumbnail
- Creator
- Destination link
- Date and time
- Category
- Searchable title and extracted metadata
- Availability status of the reel

## Primary target user
Students who frequently discover products, courses, notes, tools, fashion items, restaurants, travel ideas, and other recommendations through Instagram reels.

## Platforms
- Native or cross-platform mobile application for iOS and Android
- Responsive web application for desktop and laptop access
- No browser extension in the first release

## Recommended working title
**ReelRecall**

This is a codename only. It can be changed without affecting the specification.

## Recommended stack
- Mobile: React Native with Expo and TypeScript
- Web: Next.js App Router with TypeScript
- Shared UI and logic: Turborepo monorepo
- Backend: Supabase or PostgreSQL-based API
- Authentication: Supabase Auth or Clerk
- Storage: Supabase Storage or S3-compatible storage
- Search: PostgreSQL full-text search initially
- Background jobs: Trigger.dev, Supabase Edge Functions, or a queue worker
- Analytics: PostHog
- Error monitoring: Sentry
- Payments: RevenueCat for mobile in-app subscriptions; Stripe for web if needed later

## Document index
1. Product vision
2. Problem and users
3. Feature scope
4. Capture and ingestion flow
5. Information architecture
6. Mobile UI/UX specification
7. Web UI/UX specification
8. Design system
9. Data model
10. API specification
11. System architecture
12. Search and automatic categorization
13. Security and privacy
14. Subscription and monetization
15. Analytics
16. Testing and QA
17. Roadmap
18. Admin panel
19. Edge cases
20. Definition of done
21. Build prompt

## Non-negotiable product principle
Saving must require almost no thought. If the capture flow takes more than a few seconds or asks the user to manually fill multiple fields, the product fails regardless of how polished the interface looks.

## Current visual specification
The authoritative visual direction is defined in `DESIGN.md`: **Soft Editorial Masonry**, an editorial digital-scrapbook interface with image-led cards and a controlled masonry layout.
