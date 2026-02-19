# Artist Portfolio

Portfolio website with a single-admin CMS built on Next.js + Supabase.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Storage, RLS)

## Main Features

- Public portfolio pages:
  - Works by year (`/works/[year]`)
  - Solo/group exhibitions (`/exhibitions/solo/[slug]`, `/exhibitions/group/[slug]`)
  - Text archive (`/texts`)
  - CV (`/cv`)
- Admin CMS (`/admin`) for:
  - Works
  - Exhibitions
  - Text
  - CV
- Activity logging for admin mutations

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the app:

```bash
npm run dev
```

4. Open:

- Public: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## Database Setup

1. Apply `docs/schema.sql` to your Supabase Postgres database.
2. Update the admin singleton in `app_admin` with the real admin user UUID.
3. Create/use the storage bucket:
   - `site-assets`
4. Configure storage policies for:
   - Public read
   - Admin-only write/delete

## Project Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - run ESLint

## Notes

- This project uses a single-admin model (`app_admin` table).
- Portfolio content is image/text based (no PDF workflow).
- See `docs/PRD.md`, `docs/TechLead.md`, and `docs/DBA.md` for current scope and architecture.
