# Runtime Boundaries and Architecture Map

## Runtime Boundaries

- `app/(public)`:
  - Public pages rendered with Server Components.
  - Reads Supabase data through `lib/server.ts`.
- `app/admin`:
  - Admin UI boundary.
  - `app/admin/layout.tsx` is a Client Component auth gate.
  - Admin feature panels use `lib/client.ts`.
- `app/api/admin`:
  - Server-only mutation boundary for admin workflows.
  - Route handlers validate auth and execute writes.
- `lib/server.ts`:
  - Shared server Supabase client factory.
  - Used by Server Components and API routes.
- `lib/client.ts`:
  - Shared browser Supabase client factory.
  - Used only by Client Components.

## Critical Shared Modules and Callers

- `lib/server.ts`:
  - Called by all `app/api/admin/**/route.ts` handlers.
  - Called by public data pages such as:
    - `app/(public)/layout.tsx`
    - `app/(public)/works/[year]/page.tsx`
    - `app/(public)/exhibitions/solo/[slug]/page.tsx`
    - `app/(public)/exhibitions/group/[slug]/page.tsx`
    - `app/(public)/cv/page.tsx`
    - `app/(public)/texts/page.tsx`
  - Called by admin server pages such as `app/admin/page.tsx`.

- `lib/client.ts`:
  - Called by admin UI/auth components such as:
    - `app/admin/layout.tsx`
    - `components/admin/exhibition/AdminExhibitionsPanel.tsx`
    - `components/admin/works/WorksPanel.tsx`
    - `components/admin/text/AdminTextPanel.tsx`
    - `components/admin/bio/AdminBioSectionPanel.tsx`
    - `components/admin/shared/AdminSidebar.tsx`
    - `components/admin/dashboard/AdminLoginModal.tsx`

- `lib/constants.ts`:
  - Shared constants for:
    - storage bucket name
    - exhibition category values
    - works year range labels/values
  - Used by API routes and UI routes to reduce duplicated literals.

## Change Impact Notes

- Changes in `lib/server.ts` affect auth/data access across public pages and admin APIs.
- Changes in `lib/client.ts` affect admin login/session behavior and panel data flows.
- Changes in `lib/constants.ts` affect both route handlers and UI logic that rely on shared literals.
