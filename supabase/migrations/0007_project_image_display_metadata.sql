-- =============================================================================
-- 0007_project_image_display_metadata.sql
--
-- Apply in the SQL Editor after 0001–0006.
--
-- Per-photograph public labels (name/client, role/category, year, extra label).
-- Distinct from alt/caption. Existing rows stay null and keep using static
-- fallback text until an editor saves a value.
-- =============================================================================

alter table public.project_images
  add column if not exists display_title text,
  add column if not exists display_subtitle text,
  add column if not exists display_year text,
  add column if not exists display_label text;

comment on column public.project_images.display_title is
  'Public name/client/location shown with the photograph. Null keeps the static slot.';
comment on column public.project_images.display_subtitle is
  'Public role/category/region shown with the photograph. Null keeps the static slot.';
comment on column public.project_images.display_year is
  'Public year shown with the photograph. Null keeps the static slot or project year.';
comment on column public.project_images.display_label is
  'Optional extra public label (e.g. flycam altitude). Null keeps the static slot.';
