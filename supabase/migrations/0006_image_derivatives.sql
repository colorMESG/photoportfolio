-- =============================================================================
-- 0006_image_derivatives.sql — web + thumbnail metadata for Free-plan Storage
--
-- Apply in the SQL Editor after 0001–0005.
--
-- `storage_path` remains the public web master (optimized WebP, long edge
-- ≤ 2400). `thumbnail_path` is the admin/list derivative (long edge ≤ 480).
-- Source originals are not stored in the bucket; their filename and dimensions
-- are kept here so editors can see what was processed.
-- =============================================================================

alter table public.project_images
  add column if not exists thumbnail_path text,
  add column if not exists original_filename text,
  add column if not exists source_width integer,
  add column if not exists source_height integer,
  add column if not exists source_bytes bigint,
  add column if not exists web_bytes integer,
  add column if not exists thumbnail_bytes integer;

alter table public.gallery_images
  add column if not exists thumbnail_path text,
  add column if not exists original_filename text,
  add column if not exists source_width integer,
  add column if not exists source_height integer,
  add column if not exists source_bytes bigint,
  add column if not exists web_bytes integer,
  add column if not exists thumbnail_bytes integer,
  add column if not exists width integer,
  add column if not exists height integer;

alter table public.services
  add column if not exists thumbnail_path text,
  add column if not exists original_filename text,
  add column if not exists source_width integer,
  add column if not exists source_height integer,
  add column if not exists source_bytes bigint,
  add column if not exists web_bytes integer,
  add column if not exists thumbnail_bytes integer;

comment on column public.project_images.storage_path is
  'Optimized WebP web master inside the portfolio bucket. Never a transform URL.';
comment on column public.project_images.thumbnail_path is
  'Optimized WebP thumbnail (long edge ≤ 480) for admin lists.';
