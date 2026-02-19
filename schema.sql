-- ============================================================
-- schema.sql
-- Artist Portfolio Website
-- Supabase / PostgreSQL
--
-- Migration-style schema
-- Safe to run on a new Supabase project
--
-- Sections:
--   1. Extensions
--   2. Tables + RLS + Policies
--   3. Triggers  (auto-update updated_at)
--   4. Indexes   (query performance)
-- ============================================================



-- ============================================================
-- 1. Extensions
-- ============================================================
create extension if not exists pgcrypto;



-- ============================================================
-- 2. Tables + RLS + Policies
-- ============================================================

-- ------------------------------------------------------------
-- Admin Singleton
-- Anchors the single admin user for the system
-- ------------------------------------------------------------
create table if not exists public.app_admin (
  singleton_id boolean primary key,
  admin_user_id uuid not null unique
    references auth.users(id) on delete restrict,
  constraint app_admin_singleton_true check (singleton_id = true)
);

alter table public.app_admin enable row level security;

create policy "app_admin_select_authenticated"
on public.app_admin
for select
using ((select auth.uid()) is not null);

create policy "app_admin_update_admin_only"
on public.app_admin
for update
using ((select auth.uid()) = admin_user_id)
with check ((select auth.uid()) = admin_user_id);



-- ------------------------------------------------------------
-- Artworks (Works Only)
-- ------------------------------------------------------------
create table if not exists public.artworks (
  id           uuid        primary key default gen_random_uuid(),
  storage_path text        not null unique,
  category     text        not null check (category = 'works'),
  year         int         check (year between 1900 and 2100),
  title        text,
  caption      text        not null,
  display_order int        not null default 0 check (display_order >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.artworks enable row level security;

create policy "artworks_public_read"
on public.artworks
for select
using (true);

create policy "artworks_admin_write"
on public.artworks
for all
using (
  (select auth.uid()) = (select admin_user_id from public.app_admin where singleton_id = true)
)
with check (
  (select auth.uid()) = (select admin_user_id from public.app_admin where singleton_id = true)
);



-- ------------------------------------------------------------
-- Exhibitions (Metadata Only)
-- ------------------------------------------------------------
create table if not exists public.exhibitions (
  id            uuid        primary key default gen_random_uuid(),
  type          text        not null check (type in ('solo', 'group')),
  title         text        not null,
  slug          text        not null unique,
  description   text,
  display_order int         not null default 0 check (display_order >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.exhibitions enable row level security;

create policy "exhibitions_public_read"
on public.exhibitions
for select
using (true);

create policy "exhibitions_admin_write"
on public.exhibitions
for all
using (
  (select auth.uid()) = (select admin_user_id from public.app_admin where singleton_id = true)
)
with check (
  (select auth.uid()) = (select admin_user_id from public.app_admin where singleton_id = true)
);



-- ------------------------------------------------------------
-- Exhibition Images
-- Cascade-delete keeps images in sync when an exhibition is removed
-- ------------------------------------------------------------
create table if not exists public.exhibition_images (
  id            uuid        primary key default gen_random_uuid(),
  exhibition_id uuid        not null
    references public.exhibitions(id) on delete cascade,
  storage_path  text        not null unique,
  caption       text        not null,
  display_order int         not null default 0 check (display_order >= 0),
  is_primary    boolean     not null default false,
  created_at    timestamptz not null default now()
);

alter table public.exhibition_images enable row level security;

create policy "exhibition_images_public_read"
on public.exhibition_images
for select
using (true);

create policy "exhibition_images_admin_write"
on public.exhibition_images
for all
using (
  (select auth.uid()) = (select admin_user_id from public.app_admin where singleton_id = true)
)
with check (
  (select auth.uid()) = (select admin_user_id from public.app_admin where singleton_id = true)
);



-- ------------------------------------------------------------
-- Biography Tables (Structured CV)
-- ------------------------------------------------------------
create table if not exists public.bio_solo_exhibitions (
  id            uuid        primary key default gen_random_uuid(),
  description   text,
  description_kr text,
  display_order int         not null default 0 check (display_order >= 0),
  created_at    timestamptz not null default now()
);

create table if not exists public.bio_group_exhibitions (
  id            uuid        primary key default gen_random_uuid(),
  description   text,
  description_kr text,
  display_order int         not null default 0 check (display_order >= 0),
  created_at    timestamptz not null default now()
);

create table if not exists public.bio_education (
  id            uuid        primary key default gen_random_uuid(),
  description   text,
  description_kr text,
  display_order int         not null default 0 check (display_order >= 0),
  created_at    timestamptz not null default now()
);

create table if not exists public.bio_residency (
  id            uuid        primary key default gen_random_uuid(),
  description   text,
  description_kr text,
  display_order int         not null default 0 check (display_order >= 0),
  created_at    timestamptz not null default now()
);

create table if not exists public.bio_awards (
  id            uuid        primary key default gen_random_uuid(),
  description   text,
  description_kr text,
  display_order int         not null default 0 check (display_order >= 0),
  created_at    timestamptz not null default now()
);

create table if not exists public.bio_collections (
  id            uuid        primary key default gen_random_uuid(),
  description   text,
  description_kr text,
  display_order int         not null default 0 check (display_order >= 0),
  created_at    timestamptz not null default now()
);

-- RLS + Policies for all bio tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'bio_solo_exhibitions',
    'bio_group_exhibitions',
    'bio_education',
    'bio_residency',
    'bio_awards',
    'bio_collections'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format($sql$
      create policy "%s_public_read"
      on public.%I
      for select
      using (true)
    $sql$, t, t);

    execute format($sql$
      create policy "%s_admin_write"
      on public.%I
      for all
      using (
        (select auth.uid()) = (select admin_user_id from public.app_admin where singleton_id = true)
      )
      with check (
        (select auth.uid()) = (select admin_user_id from public.app_admin where singleton_id = true)
      )
    $sql$, t, t);
  end loop;
end $$;



-- ------------------------------------------------------------
-- Text Pages
-- ------------------------------------------------------------
create table if not exists public.texts (
  id         uuid        primary key default gen_random_uuid(),
  title      text        not null,
  year       int         not null check (year between 1900 and 2100),
  body       text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.texts enable row level security;

create policy "texts_public_read"
on public.texts
for select
using (true);

create policy "texts_admin_write"
on public.texts
for all
using (
  (select auth.uid()) = (select admin_user_id from public.app_admin where singleton_id = true)
)
with check (
  (select auth.uid()) = (select admin_user_id from public.app_admin where singleton_id = true)
);



-- ------------------------------------------------------------
-- Activity Log (Append-only)
-- ------------------------------------------------------------
create table if not exists public.activity_log (
  id          uuid        primary key default gen_random_uuid(),
  admin_id    uuid        not null
    references auth.users(id) on delete restrict,
  action_type text        not null,
  entity_type text        not null,
  entity_id   uuid        not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

alter table public.activity_log enable row level security;

create policy "activity_log_admin_read"
on public.activity_log
for select
using (
  (select auth.uid()) = (select admin_user_id from public.app_admin where singleton_id = true)
);

create policy "activity_log_admin_insert"
on public.activity_log
for insert
with check (
  (select auth.uid()) = (select admin_user_id from public.app_admin where singleton_id = true)
);



-- ============================================================
-- 3. Triggers
-- Auto-update updated_at on every row modification.
-- Centralised in one function shared by all three tables.
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger artworks_set_updated_at
  before update on public.artworks
  for each row execute function public.set_updated_at();

create trigger exhibitions_set_updated_at
  before update on public.exhibitions
  for each row execute function public.set_updated_at();

create trigger texts_set_updated_at
  before update on public.texts
  for each row execute function public.set_updated_at();



-- ============================================================
-- 4. Indexes
-- Covers the most frequent query patterns:
--   - listing ordered rows per category / type
--   - joining exhibition images to their parent
--   - finding the primary image of an exhibition
--   - querying the activity log per admin
-- ============================================================

-- artworks: fetch all works ordered for display / reorder
create index if not exists idx_artworks_category_order
  on public.artworks (category, display_order);

-- exhibitions: list by type ordered for display / reorder
create index if not exists idx_exhibitions_type_order
  on public.exhibitions (type, display_order);

-- exhibition_images: fetch all images for one exhibition, ordered
create index if not exists idx_exhibition_images_exhibition_order
  on public.exhibition_images (exhibition_id, display_order);

-- exhibition_images: find the primary image of an exhibition
create index if not exists idx_exhibition_images_primary
  on public.exhibition_images (exhibition_id, is_primary);

-- texts: list texts ordered by year (most common sort direction)
create index if not exists idx_texts_year
  on public.texts (year desc);

-- activity_log: query recent activity for an admin user
create index if not exists idx_activity_log_admin_created
  on public.activity_log (admin_id, created_at desc);


insert into public.app_admin (singleton_id, admin_user_id)
values (
  true,
  'TEST_ADMIN_USER_UUID'
);

update public.app_admin
set admin_user_id = 'REAL_ADMIN_USER_UUID'
where singleton_id = true;