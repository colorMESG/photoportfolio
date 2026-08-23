-- =============================================================================
-- 0002_rls.sql — Row Level Security, grants and Storage policies
--
-- This file is the real security boundary. The anon key ships in the browser
-- bundle and the admin route guard is only cosmetic, so every rule that matters
-- is enforced here in the database.
--
-- Shape of every table: public reads see published rows only; all writes
-- require membership in `admins`.
-- =============================================================================

-- ── is_admin() ─────────────────────────────────────────────────────────────
-- `security definer` is required: the function reads `admins`, which is itself
-- protected by a policy that calls this function. Without it the policy would
-- recurse. `search_path` is pinned so the definer rights cannot be hijacked by
-- a caller-controlled schema.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;


-- ── enable RLS everywhere ──────────────────────────────────────────────────

alter table public.projects        enable row level security;
alter table public.project_images  enable row level security;
alter table public.gallery_images  enable row level security;
alter table public.site_settings   enable row level security;
alter table public.content_blocks  enable row level security;
alter table public.services        enable row level security;
alter table public.admins          enable row level security;


-- ── projects ───────────────────────────────────────────────────────────────

create policy projects_read on public.projects
  for select using (published or public.is_admin());

create policy projects_write on public.projects
  for all using (public.is_admin()) with check (public.is_admin());


-- ── project_images — visibility follows the parent project ─────────────────

create policy project_images_read on public.project_images
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (p.published or public.is_admin())
    )
  );

create policy project_images_write on public.project_images
  for all using (public.is_admin()) with check (public.is_admin());


-- ── gallery_images ─────────────────────────────────────────────────────────

create policy gallery_images_read on public.gallery_images
  for select using (published or public.is_admin());

create policy gallery_images_write on public.gallery_images
  for all using (public.is_admin()) with check (public.is_admin());


-- ── site_settings / content_blocks — always world-readable, admin-writable ─

create policy site_settings_read on public.site_settings for select using (true);
create policy site_settings_write on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

create policy content_blocks_read on public.content_blocks for select using (true);
create policy content_blocks_write on public.content_blocks
  for all using (public.is_admin()) with check (public.is_admin());


-- ── services ───────────────────────────────────────────────────────────────

create policy services_read on public.services
  for select using (published or public.is_admin());

create policy services_write on public.services
  for all using (public.is_admin()) with check (public.is_admin());


-- ── admins ─────────────────────────────────────────────────────────────────
-- Readable by admins so the client can confirm its own role. Deliberately has
-- NO write policy: granting admin rights is only possible via the SQL editor or
-- the service role, which closes the obvious privilege-escalation path of an
-- authenticated user inserting their own id.

create policy admins_read on public.admins
  for select using (public.is_admin());


-- ── grants ─────────────────────────────────────────────────────────────────
-- RLS filters rows; grants decide whether the statement is allowed at all.
-- Both are needed. Supabase sets sensible defaults, but being explicit keeps
-- this file self-contained.

grant usage on schema public to anon, authenticated;

grant select on
  public.projects, public.project_images, public.gallery_images,
  public.site_settings, public.content_blocks, public.services
to anon, authenticated;

grant select on public.admins to authenticated;

grant insert, update, delete on
  public.projects, public.project_images, public.gallery_images,
  public.site_settings, public.content_blocks, public.services
to authenticated;


-- ── Storage ────────────────────────────────────────────────────────────────
-- A single bucket, public for reads and admin-only for writes.
--
-- "Public read" is a deliberate choice: a private bucket would require signed,
-- expiring URLs, which defeat CDN caching for the images that are the whole
-- payload of a photography site. These files are meant to be seen; what needs
-- protecting is the ability to add, replace or delete them.

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = true;

create policy portfolio_read on storage.objects
  for select using (bucket_id = 'portfolio');

create policy portfolio_insert on storage.objects
  for insert with check (bucket_id = 'portfolio' and public.is_admin());

create policy portfolio_update on storage.objects
  for update using (bucket_id = 'portfolio' and public.is_admin())
  with check (bucket_id = 'portfolio' and public.is_admin());

create policy portfolio_delete on storage.objects
  for delete using (bucket_id = 'portfolio' and public.is_admin());
