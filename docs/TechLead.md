## Tech Lead Guide

---

## 1) System Scope (Current)

### Public surface

- `/` (empty landing shell)
- `/works/[year]`
- `/exhibitions/solo/[slug]`
- `/exhibitions/group/[slug]`
- `/texts`
- `/cv`

### Admin surface

- `/admin` dashboard
- `/admin/works`
- `/admin/exhibitions`
- `/admin/text`
- `/admin/cv`

No hero media flow and no works PDF flow are currently in project scope.

---

## 2) Runtime Boundaries

### `app/(public)`

- Server Components for public reads
- Uses `supabaseServer()` for database and storage URL reads

### `app/admin`

- Client-side auth gate in `app/admin/layout.tsx`
- Verifies logged-in user against `app_admin.admin_user_id`
- Renders admin panels only for authorized user

### `app/api/admin`

- Mutation boundary for all admin writes
- Shared helpers in `lib/server/adminRoute.ts`
- Enforces auth, validation, and normalized error responses

### Shared infra

- `lib/server.ts`: server Supabase client
- `lib/client.ts`: browser Supabase client
- `lib/constants.ts`: storage bucket and shared enum-like constants

---

## 3) Data and Content Model (Implemented)

- Works: `artworks` (`category='works'`)
- Exhibitions metadata: `exhibitions`
- Exhibition images: `exhibition_images`
- CV: `bio_solo_exhibitions`, `bio_group_exhibitions`, `bio_education`, `bio_residency`, `bio_awards`, `bio_collections`
- Text archive: `texts`
- Audit trail: `activity_log`
- Admin singleton: `app_admin`

Storage bucket: `site-assets`

- `works/*`
- `solo-exhibitions/{slug}/*`
- `group-exhibitions/{slug}/*`

---

## 4) Security Model

### Identity and admin authorization

- Supabase Auth session required for admin mutations
- API routes call `requireAdminUser()` before write operations
- `app_admin` table anchors one allowed admin user ID

### Database protections

- RLS enabled for core tables in `docs/schema.sql`
- Public read policies on portfolio-facing tables
- Admin-only write policies tied to `app_admin`

### API safety patterns

- Input validation before DB writes (`zod` + route-level checks)
- UUID validation on ID-based routes
- Safe rollback paths for storage+DB multi-step writes

---

## 5) Mutation Reliability Patterns

- Upload first, then DB insert/update
- On DB failure, remove newly uploaded files
- On image replacement, delete old storage object after DB success
- Log admin mutation attempts in `activity_log` (best effort, non-blocking)

These patterns are implemented in:

- `lib/server/storageTransaction.ts`
- `lib/server/exhibitionCreate.ts`
- `lib/server/exhibitionMutation.ts`
- `lib/server/adminRoute.ts`

---

## 6) Review and Change Guardrails

- Keep mutation logic in API routes and server helpers, not UI components
- Keep `app/(public)` read-only and server-driven
- Reuse shared validators and response helpers for consistency
- Avoid changing DB shape without updating:
  - `docs/schema.sql`
  - related API routes
  - public/admin readers

---

## 7) Ongoing Operational Checklist

### Before release

- Verify admin login and session persistence
- Verify CRUD + reorder in Works, Exhibitions, Text, CV
- Verify storage cleanup on update/delete flows
- Verify recent activity panel still renders after mutations
- Verify public pages reflect updates and render on mobile/tablet/desktop

### When schema changes

- Update `docs/schema.sql` first
- Re-check RLS and index coverage
- Re-run manual smoke tests on all admin sections

---

## 8) Known Product Direction Constraints

- Image-first portfolio and exhibition model is intentional
- CV is structured and bilingual (`description`, `description_kr`)
- Single-admin model remains the security baseline
- Prefer incremental improvements over broad rewrites
