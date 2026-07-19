# Data Model

## users
- id: uuid
- email: text
- display_name: text
- avatar_url: text
- timezone: text
- locale: text
- subscription_tier: enum
- created_at: timestamptz
- updated_at: timestamptz
- deleted_at: timestamptz nullable

## saved_items
- id: uuid
- user_id: uuid
- title: text
- description: text nullable
- notes: text nullable
- source_platform: enum
- source_message_text: text nullable
- creator_name: text nullable
- creator_handle: text nullable
- original_reel_url: text nullable
- destination_url: text
- normalized_destination_url: text
- destination_domain: text
- thumbnail_url: text nullable
- thumbnail_source: enum
- received_at: timestamptz nullable
- saved_at: timestamptz
- last_opened_at: timestamptz nullable
- category_id: uuid nullable
- status: enum
- reel_status: enum
- metadata_status: enum
- is_archived: boolean
- deleted_at: timestamptz nullable
- created_at: timestamptz
- updated_at: timestamptz

## collections
- id: uuid
- user_id: uuid
- title: text
- description: text nullable
- cover_mode: enum
- cover_image_url: text nullable
- visibility: enum
- share_slug: text nullable
- share_token_hash: text nullable
- created_at: timestamptz
- updated_at: timestamptz
- archived_at: timestamptz nullable

## collection_items
- collection_id: uuid
- saved_item_id: uuid
- sort_order: integer
- added_at: timestamptz

## categories
- id: uuid
- user_id: uuid nullable
- name: text
- slug: text
- icon: text
- is_system: boolean
- created_at: timestamptz

## tags
- id: uuid
- user_id: uuid
- name: text
- created_at: timestamptz

## item_tags
- saved_item_id: uuid
- tag_id: uuid

## link_checks
- id: uuid
- saved_item_id: uuid
- check_type: enum
- status: enum
- http_status: integer nullable
- response_time_ms: integer nullable
- checked_at: timestamptz
- error_code: text nullable

## metadata_extractions
- id: uuid
- saved_item_id: uuid
- provider: text
- raw_metadata: jsonb
- extracted_title: text nullable
- extracted_description: text nullable
- extracted_image_url: text nullable
- confidence: numeric nullable
- created_at: timestamptz

## shared_collection_views
- id: uuid
- collection_id: uuid
- anonymous_id: text nullable
- referrer: text nullable
- viewed_at: timestamptz

## subscriptions
- id: uuid
- user_id: uuid
- provider: enum
- provider_customer_id: text
- provider_subscription_id: text
- product_id: text
- status: enum
- current_period_end: timestamptz nullable
- created_at: timestamptz
- updated_at: timestamptz

## audit_events
- id: uuid
- actor_user_id: uuid nullable
- event_type: text
- entity_type: text
- entity_id: uuid nullable
- metadata: jsonb
- created_at: timestamptz

## Recommended indexes
- saved_items(user_id, saved_at desc)
- saved_items(user_id, category_id)
- saved_items(user_id, creator_handle)
- saved_items(user_id, reel_status)
- saved_items using GIN full-text search vector
- collection_items(collection_id, sort_order)
- link_checks(saved_item_id, checked_at desc)

## Row-level security
Every user-owned table must restrict access to records where `user_id = auth.uid()`. Shared collections require a separate narrowly scoped public read path.
