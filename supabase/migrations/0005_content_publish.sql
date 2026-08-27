-- =============================================================================
-- 0005_content_publish.sql — draft vs published site copy
--
-- Apply in the SQL Editor after 0001–0004.
--
-- `content_blocks.data` becomes the admin draft. Visitors only see
-- `published_data`, exposed through a view so the draft JSON cannot be
-- selected with the anon key. Existing rows are backfilled so a site that is
-- already live stays live until the next Publish.
-- =============================================================================

alter table public.content_blocks
  add column if not exists published_data jsonb,
  add column if not exists published_at timestamptz;

update public.content_blocks
set published_data = coalesce(published_data, data)
where published_data is null;

alter table public.site_settings
  add column if not exists year text,
  add column if not exists favicon_path text,
  add column if not exists index_public boolean not null default false,
  add column if not exists draft jsonb,
  add column if not exists published_at timestamptz;

update public.site_settings
set year = coalesce(year, '2026')
where year is null;

-- Visitors read published columns/JSON only. The view runs as the owner so
-- RLS on the base table (admin-only select) does not hide published rows.

-- Only published_data is public. Do not coalesce to `data` — that would leak
-- a draft the first time a new key is saved.
create or replace view public.content_blocks_published as
  select
    key,
    published_data as data,
    published_at,
    updated_at
  from public.content_blocks
  where published_data is not null;

create or replace view public.site_settings_published as
  select
    id,
    brand_name,
    subtitle,
    email,
    phone,
    phone_href,
    location,
    instagram_handle,
    instagram_url,
    seo_title,
    seo_description,
    og_image_path,
    year,
    favicon_path,
    index_public,
    updated_at,
    published_at
  from public.site_settings;

grant select on public.content_blocks_published to anon, authenticated;
grant select on public.site_settings_published to anon, authenticated;

drop policy if exists content_blocks_read on public.content_blocks;
create policy content_blocks_read on public.content_blocks
  for select using (public.is_admin());

drop policy if exists site_settings_read on public.site_settings;
create policy site_settings_read on public.site_settings
  for select using (public.is_admin());

revoke select on public.content_blocks from anon;
revoke select on public.site_settings from anon;
grant select on public.content_blocks to authenticated;
grant select on public.site_settings to authenticated;
