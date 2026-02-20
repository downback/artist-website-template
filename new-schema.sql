-- ============================================================
-- schema.sql
-- Artist Portfolio Website
-- Supabase / PostgreSQL
--
-- Fresh-project schema
-- Safe to run on a new Supabase project
--
-- Sections:
--   1. Extensions
--   2. Tables + RLS + Policies
--   3. Triggers
--   4. Indexes
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
using (auth.uid() is not null);

create policy "app_admin_update_admin_only"
on public.app_admin
for update
using (auth.uid() = admin_user_id)
with check (auth.uid() = admin_user_id);



-- ------------------------------------------------------------
-- Artworks (Metadata Only)
-- ------------------------------------------------------------

create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category = 'works'),
  year int check (year between 1900 and 2100),
  title text,
  display_order int not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  auth.uid() = (
    select admin_user_id
    from public.app_admin
    where singleton_id = true
  )
)
with check (
  auth.uid() = (
    select admin_user_id
    from public.app_admin
    where singleton_id = true
  )
);



-- ------------------------------------------------------------
-- Artwork Images
-- ------------------------------------------------------------

create table if not exists public.artwork_images (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null
    references public.artworks(id) on delete cascade,
  storage_path text not null unique,
  caption text not null,
  display_order int not null default 0 check (display_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.artwork_images enable row level security;

create policy "artwork_images_public_read"
on public.artwork_images
for select
using (true);

create policy "artwork_images_admin_write"
on public.artwork_images
for all
using (
  auth.uid() = (
    select admin_user_id
    from public.app_admin
    where singleton_id = true
  )
)
with check (
  auth.uid() = (
    select admin_user_id
    from public.app_admin
    where singleton_id = true
  )
);



-- ------------------------------------------------------------
-- Exhibitions (Metadata Only)
-- ------------------------------------------------------------

create table if not exists public.exhibitions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('solo','group')),
  title text not null,
  slug text not null unique,
  description text,
  display_order int not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  auth.uid() = (
    select admin_user_id
    from public.app_admin
    where singleton_id = true
  )
)
with check (
  auth.uid() = (
    select admin_user_id
    from public.app_admin
    where singleton_id = true
  )
);



-- ------------------------------------------------------------
-- Exhibition Images
-- ------------------------------------------------------------

create table if not exists public.exhibition_images (
  id uuid primary key default gen_random_uuid(),
  exhibition_id uuid not null
    references public.exhibitions(id) on delete cascade,
  storage_path text not null unique,
  caption text not null,
  display_order int not null default 0 check (display_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
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
  auth.uid() = (
    select admin_user_id
    from public.app_admin
    where singleton_id = true
  )
)
with check (
  auth.uid() = (
    select admin_user_id
    from public.app_admin
    where singleton_id = true
  )
);



-- ------------------------------------------------------------
-- Biography Tables
-- ------------------------------------------------------------

create table if not exists public.bio_solo_exhibitions (
  id uuid primary key default gen_random_uuid(),
  description text,
  description_kr text,
  display_order int not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.bio_group_exhibitions (
  id uuid primary key default gen_random_uuid(),
  description text,
  description_kr text,
  display_order int not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.bio_education (
  id uuid primary key default gen_random_uuid(),
  description text,
  description_kr text,
  display_order int not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.bio_residency (
  id uuid primary key default gen_random_uuid(),
  description text,
  description_kr text,
  display_order int not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.bio_awards (
  id uuid primary key default gen_random_uuid(),
  description text,
  description_kr text,
  display_order int not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.bio_collections (
  id uuid primary key default gen_random_uuid(),
  description text,
  description_kr text,
  display_order int not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now()
);

-- Enable RLS + Policies for bio tables

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

    execute format(
      'create policy "%s_public_read" on public.%I for select using (true)',
      t, t
    );

    execute format(
      'create policy "%s_admin_write" on public.%I for all using (
         auth.uid() = (
           select admin_user_id from public.app_admin where singleton_id = true
         )
       ) with check (
         auth.uid() = (
           select admin_user_id from public.app_admin where singleton_id = true
         )
       )',
      t, t
    );
  end loop;
end $$;



-- ------------------------------------------------------------
-- Text Pages
-- ------------------------------------------------------------

create table if not exists public.texts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year int not null check (year between 1900 and 2100),
  body text not null,
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
  auth.uid() = (
    select admin_user_id from public.app_admin where singleton_id = true
  )
)
with check (
  auth.uid() = (
    select admin_user_id from public.app_admin where singleton_id = true
  )
);



-- ------------------------------------------------------------
-- Activity Log
-- ------------------------------------------------------------

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null
    references auth.users(id) on delete restrict,
  action_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb,
  created_at t_


-- insert into public.app_admin (singleton_id, admin_user_id)
-- values (
--   true,
--   'TEST_ADMIN_USER_UUID'
-- );