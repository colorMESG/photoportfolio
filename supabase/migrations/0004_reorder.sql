-- =============================================================================
-- 0004_reorder.sql — batch reorder helpers
--
-- One round-trip per list. Only `sort_order` is written. `display_number`,
-- cover, featured and every other column stay untouched.
--
-- Each function is limited to one kind / one parent project so a photography
-- reorder cannot move a Flycam or Corporate row.
--
-- SECURITY INVOKER: RLS still applies. is_admin() is checked as well so an
-- authenticated non-admin cannot call these even if a policy were loosened.
-- =============================================================================

create or replace function public.reorder_projects(
  p_kind project_kind,
  p_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.projects p
  set sort_order = u.ord - 1
  from unnest(p_ids) with ordinality as u(id, ord)
  where p.id = u.id
    and p.kind = p_kind;
end;
$$;

create or replace function public.reorder_project_images(
  p_project_id uuid,
  p_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.project_images i
  set sort_order = u.ord - 1
  from unnest(p_ids) with ordinality as u(id, ord)
  where i.id = u.id
    and i.project_id = p_project_id;
end;
$$;

create or replace function public.reorder_gallery_images(p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.gallery_images g
  set sort_order = u.ord - 1
  from unnest(p_ids) with ordinality as u(id, ord)
  where g.id = u.id;
end;
$$;

revoke all on function public.reorder_projects(project_kind, uuid[]) from public;
revoke all on function public.reorder_project_images(uuid, uuid[]) from public;
revoke all on function public.reorder_gallery_images(uuid[]) from public;

grant execute on function public.reorder_projects(project_kind, uuid[]) to authenticated;
grant execute on function public.reorder_project_images(uuid, uuid[]) to authenticated;
grant execute on function public.reorder_gallery_images(uuid[]) to authenticated;
