-- =============================================================================
-- 0001_init.sql — portfolio CMS schema
--
-- Apply in the Supabase dashboard: SQL Editor → paste → Run.
-- Run 0001 first, then 0002_rls.sql, then 0003_bootstrap_admin.sql.
--
-- Design notes:
--   * One `projects` table with a `kind` discriminator covers photography,
--     flycam and corporate work. They share almost every column, so splitting
--     them would triple the gallery table, the policies and the admin screens.
--   * `sort_order` and `display_number` are independent on purpose. Reordering
--     a project changes where it appears, never the "01" label shown on screen.
--   * Focal points are percentages that map straight onto CSS object-position,
--     so crops are never baked into image URLs.
-- =============================================================================

create extension if not exists pgcrypto;

create type project_kind as enum ('photography', 'flycam', 'corporate');
create type corporate_category as enum ('headshot', 'event', 'team');

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ── projects ────────────────────────────────────────────────────────────────

create table public.projects (
  id                 uuid primary key default gen_random_uuid(),
  kind               project_kind not null,
  slug               text not null,
  title              text not null,
  subtitle           text,
  category           text,
  description        text,
  location           text,
  -- Text rather than int: real values include ranges like "2025–2026".
  year               text,
  -- The visible label, e.g. "01". Edited by hand, never derived from sort_order.
  display_number     text,
  sort_order         integer not null default 0,
  cover_image_id     uuid,
  published          boolean not null default false,

  -- flycam only
  coordinates        text,
  altitude           text,

  -- corporate only
  client             text,
  corporate_category corporate_category,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint projects_slug_unique_per_kind unique (kind, slug)
);

comment on column public.projects.sort_order is
  'Sort position only. Changing it must never alter display_number.';
comment on column public.projects.display_number is
  'The numeral rendered in the UI. Independent of sort_order.';


-- ── project_images — the shared image model for every project gallery ───────

create table public.project_images (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,

  -- Exactly one source. `storage_path` is a key inside the `portfolio` bucket,
  -- never a full URL, so the delivery host or transform settings can change
  -- later without touching data. `external_url` exists only to carry the
  -- current Unsplash placeholders through the migration.
  storage_path  text,
  external_url  text,

  alt           text not null default '',
  caption       text,
  width         integer,
  height        integer,

  focal_point_x smallint not null default 50 check (focal_point_x between 0 and 100),
  focal_point_y smallint not null default 50 check (focal_point_y between 0 and 100),

  sort_order    integer not null default 0,
  featured      boolean not null default false,

  -- Per-image capture data, replacing the six shared presets in the prototype.
  camera        text,
  lens          text,
  exposure      text,

  created_at    timestamptz not null default now(),

  constraint project_images_needs_a_source
    check (storage_path is not null or external_url is not null)
);

-- Added after the fact because the reference is circular.
alter table public.projects
  add constraint projects_cover_image_fk
  foreign key (cover_image_id) references public.project_images(id) on delete set null;


-- ── gallery_images — Personal Gallery, standalone with no parent project ────

create table public.gallery_images (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text,
  external_url  text,
  alt           text not null default '',
  caption       text,
  location      text,
  year          text,
  focal_point_x smallint not null default 50 check (focal_point_x between 0 and 100),
  focal_point_y smallint not null default 50 check (focal_point_y between 0 and 100),
  sort_order    integer not null default 0,
  featured      boolean not null default false,
  published     boolean not null default true,
  camera        text,
  lens          text,
  exposure      text,
  created_at    timestamptz not null default now(),

  constraint gallery_images_needs_a_source
    check (storage_path is not null or external_url is not null)
);


-- ── site_settings — identity, contact and SEO. Exactly one row. ─────────────

create table public.site_settings (
  -- The boolean primary key with a `check (id)` makes a second row impossible.
  id                boolean primary key default true,
  brand_name        text not null default '',
  subtitle          text,
  email             text,
  phone             text,
  -- The tel: target, which differs from the display format of `phone`.
  phone_href        text,
  location          text,
  instagram_handle  text,
  instagram_url     text,
  seo_title         text,
  seo_description   text,
  og_image_path     text,
  updated_at        timestamptz not null default now(),

  constraint site_settings_single_row check (id)
);


-- ── content_blocks — page copy that isn't a collection ─────────────────────
-- Keys: hero, marquee, statement, about, contact, footer, ui_labels.
-- Kept as jsonb rather than ~40 more columns on site_settings; each key has a
-- matching TypeScript type on the client.

create table public.content_blocks (
  key        text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);


-- ── services ───────────────────────────────────────────────────────────────

create table public.services (
  id             uuid primary key default gen_random_uuid(),
  display_number text,
  title          text not null,
  subtitle       text,
  storage_path   text,
  external_url   text,
  sort_order     integer not null default 0,
  published      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);


-- ── admins — membership here is what grants write access ────────────────────

create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);


-- ── indexes ────────────────────────────────────────────────────────────────

create index projects_kind_sort_idx        on public.projects (kind, sort_order);
create index projects_published_idx        on public.projects (published) where published;
create index project_images_project_idx    on public.project_images (project_id, sort_order);
create index gallery_images_sort_idx       on public.gallery_images (sort_order);
create index services_sort_idx             on public.services (sort_order);


-- ── updated_at triggers ────────────────────────────────────────────────────

create trigger projects_touch
  before update on public.projects
  for each row execute function public.touch_updated_at();

create trigger site_settings_touch
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

create trigger content_blocks_touch
  before update on public.content_blocks
  for each row execute function public.touch_updated_at();

create trigger services_touch
  before update on public.services
  for each row execute function public.touch_updated_at();
