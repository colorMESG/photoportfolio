-- =============================================================================
-- 0008_project_visibility_overrides.sql
--
-- Apply in the SQL Editor after 0001–0007.
--
-- A kind+slug tombstone so hiding a static-backed project does not restore
-- the source-code fallback. Deleting the projects row is no longer enough.
--
-- visible = false  → public renders nothing for that slug
-- visible = true or no row → published managed project, else static fallback
-- =============================================================================

create table if not exists public.project_visibility_overrides (
  kind       public.project_kind not null,
  slug       text not null,
  visible    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (kind, slug)
);

comment on table public.project_visibility_overrides is
  'Per-slug public visibility. Hidden static projects stay in Admin and do not resurrect from src/content/.';

drop trigger if exists project_visibility_overrides_touch on public.project_visibility_overrides;
create trigger project_visibility_overrides_touch
  before update on public.project_visibility_overrides
  for each row execute function public.touch_updated_at();

alter table public.project_visibility_overrides enable row level security;

drop policy if exists project_visibility_overrides_read on public.project_visibility_overrides;
create policy project_visibility_overrides_read on public.project_visibility_overrides
  for select using (true);

drop policy if exists project_visibility_overrides_write on public.project_visibility_overrides;
create policy project_visibility_overrides_write on public.project_visibility_overrides
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.project_visibility_overrides to anon, authenticated;
grant insert, update, delete on public.project_visibility_overrides to authenticated;
