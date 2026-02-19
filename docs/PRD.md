# Product Requirements Document (PRD)

**Project:** Narae Won Portfolio Website + Admin CMS  
**Owner:** Product  
**Stakeholders:** Artist (Client), Developer, Tech Lead, Designer, DBA  
**Status:** Active implementation baseline

---

## 1. Product Overview

### Purpose

Provide a maintainable portfolio site where a single authenticated admin can manage works, exhibitions, texts, and CV content without code changes.

### Current Product Shape

The current implementation is an image/text portfolio, not a PDF/hero workflow:

- Public routes are centered on `works`, `exhibitions`, `texts`, and `cv`
- Admin routes are centered on dashboard + content CRUD/reorder
- Content is managed via Supabase DB + Storage with API routes

### Value Proposition

- Artist can update portfolio content independently
- Public site remains clean, fast, and responsive
- Data model stays structured and predictable
- Team avoids introducing a full generic CMS

---

## 2. Goals and Non-Goals

### Goals

- Keep the public portfolio stable while content updates happen frequently
- Provide clear, safe admin workflows for create/update/delete/reorder
- Enforce single-admin security model across DB, API, and UI
- Preserve bilingual CV content (Korean + English fields)

### Non-Goals

- No hero media management
- No works PDF management
- No contact form CMS
- No role hierarchy beyond one admin user
- No drafts, approvals, or version history

---

## 3. Target Users

### Artist (Admin)

Uses `/admin` to manage:

- Works images by year
- Solo/group exhibitions and images
- Text entries
- CV rows across six sections

### Public Visitors

Consume portfolio content through:

- Works pages by year range
- Exhibition detail pages (solo/group)
- Text archive page
- CV page

### Internal Maintainers

Need reliable schema constraints, simple operational flows, and low-risk extensibility.

---

## 4. Public Experience Requirements

- Public pages must remain usable on mobile, tablet, and desktop
- Sidebar navigation must adapt to available works years and exhibition slugs
- Exhibition pages must support primary image + additional detail images
- CV page must support bilingual descriptions across all CV sections

---

## 5. Admin Experience Requirements

### Authentication and Access

- Admin enters through `/admin`
- Session is checked against `app_admin.singleton_id=true`
- Non-admin or unauthenticated users are blocked from mutations

### Content Management Areas

- Dashboard with quick preview + recent activity
- Works management (`/admin/works`)
- Exhibitions management (`/admin/exhibitions`)
- Text management (`/admin/text`)
- CV management (`/admin/cv`)

### Feedback and Safety

- Validation errors must be shown for invalid inputs/files
- Successful updates should be reflected in public pages without manual migration work
- Failed write flows should avoid partial broken states (storage rollback where applicable)

---

## 6. Functional Requirements

### FR1 - Works Management

- Admin can create, update, delete, and reorder works
- Works include image, year, title, caption, and display order
- Works render by year/year-range in public routes

### FR2 - Exhibitions Management

- Admin can create/update exhibition metadata (type, title, slug, description)
- Admin can manage primary + additional exhibition images
- Admin can delete individual additional images or full exhibitions

### FR3 - Text Management

- Admin can create, edit, and delete text entries
- Required fields: title, year, body
- Public texts are ordered by year and created time

### FR4 - CV Management

- Admin can create, edit, delete, and reorder CV rows in six sections:
  - Solo exhibitions
  - Group exhibitions
  - Education
  - Residency
  - Awards
  - Collections
- Each row contains `description` and `description_kr`

### FR5 - Auditability

- Content mutations should record activity in `activity_log`
- Dashboard should show recent content activity for operations visibility

### FR6 - Security and Integrity

- All admin mutation routes require authenticated admin validation
- Public reads are allowed only for required portfolio tables
- DB remains source of truth; storage objects map to DB references

---

## 7. Data and Storage Requirements

### Storage

- Bucket: `site-assets`
- Image paths under:
  - `works/`
  - `solo-exhibitions/{slug}/`
  - `group-exhibitions/{slug}/`

### Database Domains

- Admin singleton: `app_admin`
- Works: `artworks` (category fixed to `works`)
- Exhibitions: `exhibitions` + `exhibition_images`
- CV: six `bio_*` tables
- Text pages: `texts`
- Audit log: `activity_log`

---

## 8. Roles and Responsibilities

### Product

- Keep scope aligned to current portfolio workflow
- Prioritize reliability over feature breadth

### Tech Lead

- Guard architecture boundaries (`app/(public)`, `app/admin`, `app/api/admin`)
- Ensure auth, validation, and rollback behavior remain consistent

### DBA

- Maintain schema, policies, constraints, and indexes
- Keep RLS/storage policy alignment with single-admin model

### Designer

- Preserve public visual language and responsive behavior
- Keep admin UX clear and low-friction for a non-technical editor

---

## 9. Success Metrics

- Admin can manage works, exhibitions, texts, and CV without developer intervention
- Public pages reflect admin updates reliably
- No unauthorized mutation access in production
- No recurring content integrity incidents (orphan records/files, invalid references)
