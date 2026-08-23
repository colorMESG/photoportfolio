import { requireSupabase } from "../supabase";
import type { ProjectImageRow } from "./types";
import type { Result } from "./projects";

function describe(error: { code?: string; message: string }): string {
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "The database refused this write. The signed-in account is not an administrator.";
  }
  return error.message;
}

export async function listProjectImages(projectId: string): Promise<Result<ProjectImageRow[]>> {
  const { data, error } = await requireSupabase()
    .from("project_images")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return { data: (data as ProjectImageRow[]) ?? null, error: error ? describe(error) : null };
}

export async function insertProjectImage(
  row: Pick<
    ProjectImageRow,
    | "project_id"
    | "storage_path"
    | "alt"
    | "width"
    | "height"
    | "sort_order"
    | "featured"
    | "focal_point_x"
    | "focal_point_y"
  >
): Promise<Result<ProjectImageRow>> {
  const { data, error } = await requireSupabase()
    .from("project_images")
    .insert(row)
    .select()
    .single();
  return { data: (data as ProjectImageRow) ?? null, error: error ? describe(error) : null };
}

export async function updateProjectImage(
  id: string,
  patch: Partial<
    Pick<
      ProjectImageRow,
      "alt" | "caption" | "featured" | "focal_point_x" | "focal_point_y" | "sort_order"
    >
  >
): Promise<Result<ProjectImageRow>> {
  const { data, error } = await requireSupabase()
    .from("project_images")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return { data: (data as ProjectImageRow) ?? null, error: error ? describe(error) : null };
}

export async function deleteProjectImage(id: string): Promise<Result<true>> {
  const { error } = await requireSupabase().from("project_images").delete().eq("id", id);
  return { data: error ? null : true, error: error ? describe(error) : null };
}

export async function listImagesForProjects(
  projectIds: string[]
): Promise<Result<ProjectImageRow[]>> {
  if (projectIds.length === 0) return { data: [], error: null };
  const { data, error } = await requireSupabase()
    .from("project_images")
    .select("*")
    .in("project_id", projectIds)
    .order("sort_order", { ascending: true });
  return { data: (data as ProjectImageRow[]) ?? null, error: error ? describe(error) : null };
}

export async function nextImageSortOrder(projectId: string): Promise<number> {
  const { data } = await requireSupabase()
    .from("project_images")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const highest = (data as { sort_order: number } | null)?.sort_order;
  return typeof highest === "number" ? highest + 1 : 0;
}
