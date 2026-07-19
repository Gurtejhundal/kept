# Admin Panel Specification

## Purpose
The admin panel is for operational control, moderation, support, and system health. It must not expose private user content broadly to staff.

## Roles
- Super admin
- Support
- Operations
- Analyst
- Read-only auditor

## Dashboard
- New users
- Active users
- Saves created
- Save failures
- Metadata extraction success
- Background job failures
- Link check failures
- Subscription status
- Storage usage

## User support
- Search user by account identifier
- View account status
- View subscription entitlement
- Revoke sessions
- Trigger export
- Start account deletion workflow
- Never reveal passwords or raw authentication secrets

## Content operations
- View reported shared collections
- Disable abusive public share links
- Review suspicious domains
- Maintain blocked-domain list
- Reprocess metadata
- Re-run failed availability checks

## System operations
- Job queue
- Failed jobs
- Retry controls
- Provider health
- Rate-limit status
- Storage alerts
- Audit logs

## Privacy controls
- Default staff view should hide full URLs and personal notes.
- Sensitive detail access should require elevated permission and create an audit record.
- Publicly shared content can be moderated more broadly than private items.

## Audit trail
Record:
- Admin actor
- Action
- Target
- Timestamp
- Reason
- Before and after state where appropriate
