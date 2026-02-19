# DBA Product Requirements (Current Baseline)

**Project:** Narae Won Portfolio Website  
**Audience:** DBA / Backend Engineering  
**Role Scope:** Schema design, RLS/policies, storage structure, integrity operations  
**Out of Scope:** UI/UX and frontend component implementation

---

## 1. Project Context

The current portfolio is implemented as a Supabase-backed content system:

- Public read access for portfolio content
- Single-admin write access for content operations
- Image and text records managed through API mutation routes

The database is the source of truth. Storage files are operational assets referenced by DB rows.

---

## 2. Core Characteristics

- Single admin identity anchored in `public.app_admin`
- Public read, admin write model
- Works and exhibition media are image-based
- Text archive is structured in `public.texts`
- CV content is structured across six ordered `bio_*` tables
- Activity logging is append-only and admin-readable
- No drafts, versions, soft deletes, or multi-role auth

---

## 3. Storage Requirements (Supabase Storage)

### 3.1 Bucket

- Bucket: `site-assets`
- Expected access model:
  - Public read
  - Authenticated admin write/delete

### 3.2 Path Patterns

```
site-assets/
├── works/{generated-file-name}
├── solo-exhibitions/{slug}/{generated-file-name}
└── group-exhibitions/{slug}/{generated-file-name}
```

Notes:

- Paths are generated per upload (not fixed file names)
- On media replacement, DB row may point to a new storage path and old file is removed
- Folder creation is implicit through uploads

### 3.3 Integrity Rules

- DB row references must correspond to real storage objects
- Failed multi-step writes must clean up uploaded files when possible
- Storage is not the authoritative source for metadata or ordering

---

## 4. Database Domains

1. Admin identity and authorization anchor (`app_admin`)
2. Works metadata (`artworks`)
3. Exhibition metadata + images (`exhibitions`, `exhibition_images`)
4. Structured CV sections (`bio_*` tables)
5. Text records (`texts`)
6. Mutation audit trail (`activity_log`)

---

## 5. Canonical Tables

### 5.1 `app_admin` (singleton)

- `singleton_id boolean primary key` (`true` only)
- `admin_user_id uuid unique references auth.users(id)`

Purpose:

- Defines exactly one user allowed to perform admin writes.

### 5.2 `artworks` (works images only)

- `id uuid pk`
- `storage_path text unique not null`
- `category text not null check (category = 'works')`
- `year int check (1900..2100)`
- `title text`
- `caption text not null`
- `display_order int not null default 0`
- `created_at`, `updated_at`

### 5.3 `exhibitions` (metadata)

- `id uuid pk`
- `type text check (type in ('solo', 'group'))`
- `title text not null`
- `slug text unique not null`
- `description text`
- `display_order int not null default 0`
- `created_at`, `updated_at`

### 5.4 `exhibition_images`

- `id uuid pk`
- `exhibition_id uuid references exhibitions(id) on delete cascade`
- `storage_path text unique not null`
- `caption text not null`
- `display_order int not null default 0`
- `is_primary boolean not null default false`
- `created_at`

### 5.5 CV Tables

- `bio_solo_exhibitions`
- `bio_group_exhibitions`
- `bio_education`
- `bio_residency`
- `bio_awards`
- `bio_collections`

Each table uses:

- `id uuid pk`
- `description text`
- `description_kr text`
- `display_order int not null default 0`
- `created_at`

### 5.6 `texts`

- `id uuid pk`
- `title text not null`
- `year int not null check (1900..2100)`
- `body text not null`
- `created_at`, `updated_at`

### 5.7 `activity_log`

- `id uuid pk`
- `admin_id uuid references auth.users(id)`
- `action_type text not null`
- `entity_type text not null`
- `entity_id uuid not null`
- `metadata jsonb`
- `created_at`

---

## 6. Access Control and RLS

### Public Read

Public select is enabled for portfolio tables:

- `artworks`
- `exhibitions`
- `exhibition_images`
- all `bio_*` tables
- `texts`

### Admin Write

Write access is restricted by checking:

`auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true)`

Applied to:

- `artworks`
- `exhibitions`
- `exhibition_images`
- all `bio_*` tables
- `texts`

### Activity Log Access

- `activity_log`: admin read + admin insert
- No public access policy expected

---

## 7. Triggers and Indexes

### Updated Timestamp Trigger

`set_updated_at()` trigger function is used for:

- `artworks`
- `exhibitions`
- `texts`

### Required Index Coverage

- `artworks(category, display_order)`
- `exhibitions(type, display_order)`
- `exhibition_images(exhibition_id, display_order)`
- `exhibition_images(exhibition_id, is_primary)`
- `texts(year desc)`
- `activity_log(admin_id, created_at desc)`

---

## 8. Data Integrity Expectations

- No orphan `exhibition_images` rows after exhibition delete (FK cascade)
- No duplicate storage path references (unique constraints)
- Deterministic ordering by `display_order`
- Validation prevents invalid year, missing required text fields, and invalid IDs at API level

Operationally, mutation routes should:

- Upload file first
- Write DB row
- Roll back uploaded files when DB write fails
- Remove stale files after successful replacement

---

## 9. Non-Requirements

- No drafts/revisions/versioning
- No soft delete model
- No generalized tagging/search system
- No multi-admin role model in current phase

---

## 10. DBA Responsibilities

1. Keep `docs/schema.sql` as the single schema baseline
2. Maintain RLS and policy correctness for all mutable tables
3. Ensure index coverage for real query/reorder patterns
4. Prevent invalid states between DB rows and storage references
5. Support safe schema evolution with low operational risk

---

## Final Summary

| Area            | Decision                                        |
| --------------- | ----------------------------------------------- |
| Auth model      | Single admin via `app_admin`                    |
| Works           | `artworks` table (`category='works'`)           |
| Exhibitions     | Split metadata/images tables                    |
| CV              | 6 ordered bilingual `bio_*` tables              |
| Text            | `texts` with title/year/body                    |
| Storage         | `site-assets` + semantic folder prefixes        |
| Audit           | `activity_log` append-only insert/read for admin |
