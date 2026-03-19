-- ============================================================
-- schema.sql
-- Artist Portfolio Website
-- Supabase / PostgreSQL
--
-- INITIAL DEPLOYMENT VERSION
-- Safe for fresh Supabase project
--
-- Sections:
--   1. Extensions
--   2. Tables
--   3. RLS + Policies
--   4. Triggers
--   5. Indexes
-- ============================================================



-- ============================================================
-- 1. Extensions
-- ============================================================

create extension if not exists pgcrypto;



-- ============================================================
-- 2. Tables
-- ============================================================


-- ------------------------------------------------------------
-- Admin Singleton
-- ------------------------------------------------------------

create table public.app_admin (
  singleton_id boolean primary key,
  admin_user_id uuid not null unique
    references auth.users(id) on delete restrict,
  constraint app_admin_singleton_true check (singleton_id = true)
);



-- ------------------------------------------------------------
-- Artworks (Metadata Only)
-- ------------------------------------------------------------

create table public.artworks (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  year int,
  title text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);



-- ------------------------------------------------------------
-- Artwork Images
-- - Primary image caption is required by the app flow.
-- - Additional image captions are optional in the UI and may be saved
--   as an empty string, so `caption` remains NOT NULL.
-- ------------------------------------------------------------

create table public.artwork_images (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null
    references public.artworks(id) on delete cascade,
  storage_path text not null unique,
  caption text not null,
  display_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);



-- ------------------------------------------------------------
-- Exhibitions (Metadata Only)
-- ------------------------------------------------------------

create table public.exhibitions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('solo','group')),
  title text not null,
  slug text not null unique,
  description text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);



-- ------------------------------------------------------------
-- Exhibition Images
-- - Primary image caption is required by the app flow.
-- - Additional image captions are optional in the UI and may be saved
--   as an empty string, so `caption` remains NOT NULL.
-- ------------------------------------------------------------

create table public.exhibition_images (
  id uuid primary key default gen_random_uuid(),
  exhibition_id uuid not null
    references public.exhibitions(id) on delete cascade,
  storage_path text not null unique,
  caption text not null,
  display_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);



-- ------------------------------------------------------------
-- Biography Tables
-- ------------------------------------------------------------

create table public.bio_solo_exhibitions (
  id uuid primary key default gen_random_uuid(),
  description text,
  description_kr text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.bio_group_exhibitions (
  id uuid primary key default gen_random_uuid(),
  description text,
  description_kr text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.bio_education (
  id uuid primary key default gen_random_uuid(),
  description text,
  description_kr text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.bio_residency (
  id uuid primary key default gen_random_uuid(),
  description text,
  description_kr text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.bio_awards (
  id uuid primary key default gen_random_uuid(),
  description text,
  description_kr text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.bio_collections (
  id uuid primary key default gen_random_uuid(),
  description text,
  description_kr text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);



-- ------------------------------------------------------------
-- Text Pages
-- ------------------------------------------------------------

create table public.texts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year int not null,
  body text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);



-- ------------------------------------------------------------
-- Activity Log
-- ------------------------------------------------------------

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null
    references auth.users(id) on delete restrict,
  action_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);



-- ============================================================
-- 3. RLS + POLICIES
-- ============================================================


-- Enable RLS on all tables

alter table public.app_admin enable row level security;
alter table public.artworks enable row level security;
alter table public.artwork_images enable row level security;
alter table public.exhibitions enable row level security;
alter table public.exhibition_images enable row level security;
alter table public.texts enable row level security;
alter table public.bio_solo_exhibitions enable row level security;
alter table public.bio_group_exhibitions enable row level security;
alter table public.bio_education enable row level security;
alter table public.bio_residency enable row level security;
alter table public.bio_awards enable row level security;
alter table public.bio_collections enable row level security;
alter table public.activity_log enable row level security;



-- Admin Singleton Policies

create policy "app_admin_select_authenticated"
on public.app_admin
for select
using (auth.uid() is not null);

create policy "app_admin_update_admin_only"
on public.app_admin
for update
using (auth.uid() = admin_user_id)
with check (auth.uid() = admin_user_id);



-- Public read policies

create policy "artworks_public_read" on public.artworks for select using (true);
create policy "artwork_images_public_read" on public.artwork_images for select using (true);
create policy "exhibitions_public_read" on public.exhibitions for select using (true);
create policy "exhibition_images_public_read" on public.exhibition_images for select using (true);
create policy "texts_public_read" on public.texts for select using (true);



-- Admin write policies (FOR ALL pattern)

create policy "artworks_admin_write"
on public.artworks
for all
using (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true))
with check (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true));

create policy "artwork_images_admin_write"
on public.artwork_images
for all
using (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true))
with check (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true));

create policy "exhibitions_admin_write"
on public.exhibitions
for all
using (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true))
with check (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true));

create policy "exhibition_images_admin_write"
on public.exhibition_images
for all
using (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true))
with check (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true));

create policy "texts_admin_write"
on public.texts
for all
using (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true))
with check (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true));



-- Bio policies (loop)

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
    execute format(
      'create policy "%s_public_read" on public.%I for select using (true)',
      t, t
    );

    execute format(
      'create policy "%s_admin_write" on public.%I for all
       using (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true))
       with check (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true))',
      t, t
    );
  end loop;
end $$;



-- Activity Log policies

create policy "activity_log_admin_read"
on public.activity_log
for select
using (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true));

create policy "activity_log_admin_insert"
on public.activity_log
for insert
with check (auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true));



-- ============================================================
-- 4. Triggers
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
-- 5. Indexes
-- ============================================================

create index idx_artworks_category_order
  on public.artworks (category, display_order);

create index idx_artwork_images_artwork_order
  on public.artwork_images (artwork_id, display_order);

create index idx_artwork_images_primary
  on public.artwork_images (artwork_id, is_primary);

create index idx_artwork_images_artwork_primary_order
  on public.artwork_images (artwork_id, is_primary, display_order);

create unique index idx_artwork_images_one_primary
  on public.artwork_images (artwork_id)
  where is_primary = true;

create index idx_exhibitions_type_order
  on public.exhibitions (type, display_order);

create index idx_exhibition_images_exhibition_order
  on public.exhibition_images (exhibition_id, display_order);

create index idx_exhibition_images_primary
  on public.exhibition_images (exhibition_id, is_primary);

create index idx_exhibition_images_exhibition_primary_order
  on public.exhibition_images (exhibition_id, is_primary, display_order);

create unique index idx_exhibition_images_one_primary
  on public.exhibition_images (exhibition_id)
  where is_primary = true;

create index idx_texts_year
  on public.texts (year desc);

create index idx_texts_display_order
  on public.texts (display_order desc, created_at desc);

create index idx_activity_log_admin_created
  on public.activity_log (admin_id, created_at desc);

-- ============================================================
-- After running above, run one of the below SQL commands to set your admin user ID in the app_admin singleton table.
-- ============================================================

-- -- Initial insert
-- insert into public.app_admin (singleton_id, admin_user_id)
-- values (true, 'YOUR_REAL_ADMIN_UUID');

-- -- Update insert
-- update public.app_admin
-- set admin_user_id = 'REAL_ADMIN_UUID'
-- where singleton_id = true;

-- ============================================================
-- Bucket Polices
-- ============================================================
-- -- site-assets / group-exhibitions / solo-exhibitions / works

-- -- 1) Ensure bucket exists
-- insert into storage.buckets (id, name, public)
-- values ('site-assets', 'site-assets', true)
-- on conflict (id) do nothing;

-- -- 2) Public read for this bucket
-- create policy "site_assets_public_read"
-- on storage.objects
-- for select
-- using (bucket_id = 'site-assets');

-- -- 3) Admin write/update/delete (single admin from app_admin)
-- create policy "site_assets_admin_insert"
-- on storage.objects
-- for insert
-- with check (
--   bucket_id = 'site-assets'
--   and auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true)
-- );

-- create policy "site_assets_admin_update"
-- on storage.objects
-- for update
-- using (
--   bucket_id = 'site-assets'
--   and auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true)
-- )
-- with check (
--   bucket_id = 'site-assets'
--   and auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true)
-- );

-- create policy "site_assets_admin_delete"
-- on storage.objects
-- for delete
-- using (
--   bucket_id = 'site-assets'
--   and auth.uid() = (select admin_user_id from public.app_admin where singleton_id = true)
-- );

-- ============================================================
-- Existing Project Sync Notes
-- Run these only if your Supabase project was created before the
-- current work-image additional-caption flow was added.
-- ============================================================

-- 1) Ensure `caption` exists and stays non-null on artwork images.
--    Optional additional-image captions are stored as '' when empty.
--
-- alter table public.artwork_images
-- add column if not exists caption text;
--
-- update public.artwork_images
-- set caption = ''
-- where caption is null;
--
-- alter table public.artwork_images
-- alter column caption set not null;

-- 2) Add the newer helper index if it does not already exist.
--
-- create index if not exists idx_artwork_images_artwork_primary_order
--   on public.artwork_images (artwork_id, is_primary, display_order);

-- 3) Ensure `caption` exists and stays non-null on exhibition images.
--    Optional additional-image captions are stored as '' when empty.
--
-- alter table public.exhibition_images
-- add column if not exists caption text;
--
-- update public.exhibition_images
-- set caption = ''
-- where caption is null;
--
-- alter table public.exhibition_images
-- alter column caption set not null;

-- 4) Add the newer helper index if it does not already exist.
--
-- create index if not exists idx_exhibition_images_exhibition_primary_order
--   on public.exhibition_images (exhibition_id, is_primary, display_order);

-- 5) Ensure `display_order` exists on texts for admin drag-and-drop ordering.
--
-- alter table public.texts
-- add column if not exists display_order int;
--
-- with ranked_texts as (
--   select id, row_number() over (order by year desc, created_at desc) as next_order
--   from public.texts
-- )
-- update public.texts
-- set display_order = ranked_texts.next_order
-- from ranked_texts
-- where public.texts.id = ranked_texts.id
--   and public.texts.display_order is null;
--
-- update public.texts
-- set display_order = 0
-- where display_order is null;
--
-- alter table public.texts
-- alter column display_order set default 0;
--
-- alter table public.texts
-- alter column display_order set not null;
--
-- create index if not exists idx_texts_display_order
--   on public.texts (display_order desc, created_at desc);
