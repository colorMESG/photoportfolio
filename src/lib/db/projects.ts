import { requireSupabase } from "../supabase";
import type { ProjectDraft, ProjectKind, ProjectRow } from "./types";

/**
 * Admin data access for the `projects` table.
 *
 * Every function returns `{ data, error }` rather than throwing, because the
 * failures that matter here are expected ones — a duplicate slug, or an RLS
 * refusal when the session is not an admin — and the forms need to show them
 * rather than crash.
 */
export interface Result<T> {
  data: T | null;
  error: string | null;
}

/** Turns Postgres error codes into something a person can act on. */
function describe(error: { code?: string; message: string; details?: string }): string {
  // Unique violation, in practice always the (kind, slug) pair.
  if (error.code === "23505" || /duplicate key/i.test(error.message)) {
    return "A project of this type already uses that slug. Choose a different one.";
  }
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "The database refused this write. The signed-in account is not an administrator.";
  }
  return error.message;
}

export async function listProjects(kind: ProjectKind): Promise<Result<ProjectRow[]>> {
  const { data, error } = await requireSupabase()
    .from("projects")
    .select("*")
    .eq("kind", kind)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return { data: (data as ProjectRow[]) ?? null, error: error ? describe(error) : null };
}

export async function listAllSlugs(kind: ProjectKind): Promise<string[]> {
  const { data } = await requireSupabase().from("projects").select("slug").eq("kind", kind);
  return (data ?? []).map((r) => (r as { slug: string }).slug);
}

export async function getProject(id: string): Promise<Result<ProjectRow>> {
  const { data, error } = await requireSupabase()
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return { data: (data as ProjectRow) ?? null, error: error ? describe(error) : null };
}

export async function createProject(draft: ProjectDraft): Promise<Result<ProjectRow>> {
  const { data, error } = await requireSupabase()
    .from("projects")
    .insert(draft)
    .select()
    .single();
  return { data: (data as ProjectRow) ?? null, error: error ? describe(error) : null };
}

export async function updateProject(
  id: string,
  patch: Partial<ProjectDraft>
): Promise<Result<ProjectRow>> {
  const { data, error } = await requireSupabase()
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return { data: (data as ProjectRow) ?? null, error: error ? describe(error) : null };
}

export async function deleteProject(id: string): Promise<Result<true>> {
  const { error } = await requireSupabase().from("projects").delete().eq("id", id);
  return { data: error ? null : true, error: error ? describe(error) : null };
}

export async function setPublished(id: string, published: boolean): Promise<Result<ProjectRow>> {
  return updateProject(id, { published });
}

/**
 * The next free sort position for a kind. Deliberately does not touch
 * `display_number`: a new project lands at the end of the order, and its visible
 * label is whatever the author types.
 */
export async function nextSortOrder(kind: ProjectKind): Promise<number> {
  const { data } = await requireSupabase()
    .from("projects")
    .select("sort_order")
    .eq("kind", kind)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const highest = (data as { sort_order: number } | null)?.sort_order;
  return typeof highest === "number" ? highest + 1 : 0;
}

/** A blank draft, used by the "new project" form. */
export function emptyProject(kind: ProjectKind, sortOrder: number): ProjectDraft {
  return {
    kind,
    slug: "",
    title: "",
    subtitle: null,
    category: null,
    description: null,
    location: null,
    year: null,
    display_number: null,
    sort_order: sortOrder,
    cover_image_id: null,
    published: false,
    coordinates: null,
    altitude: null,
    client: null,
    corporate_category: kind === "corporate" ? "headshot" : null,
  };
}
