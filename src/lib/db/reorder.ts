import { requireSupabase } from "../supabase";
import type { Result } from "./projects";
import type { ProjectKind } from "./types";

function describe(error: { code?: string; message: string }): string {
  if (error.code === "42501" || /not authorized|row-level security/i.test(error.message)) {
    return "The database refused this reorder. The signed-in account is not an administrator.";
  }
  if (/could not find the function|PGRST202/i.test(error.message)) {
    return "Reorder is not installed on the database yet. Run supabase/migrations/0004_reorder.sql.";
  }
  return error.message;
}

/**
 * Persist a new order in one request. Only `sort_order` is written.
 * `display_number` is never part of this payload.
 */
export async function reorderProjects(
  kind: ProjectKind,
  ids: string[]
): Promise<Result<true>> {
  const supabase = requireSupabase();
  const { error } = await supabase.rpc("reorder_projects", {
    p_kind: kind,
    p_ids: ids,
  });
  if (!error) return { data: true, error: null };
  if (!missingRpc(error.message)) {
    return { data: null, error: describe(error) };
  }
  return patchOrders("projects", ids);
}

export async function reorderProjectImages(
  projectId: string,
  ids: string[]
): Promise<Result<true>> {
  const supabase = requireSupabase();
  const { error } = await supabase.rpc("reorder_project_images", {
    p_project_id: projectId,
    p_ids: ids,
  });
  if (!error) return { data: true, error: null };
  if (!missingRpc(error.message)) {
    return { data: null, error: describe(error) };
  }
  return patchOrders("project_images", ids);
}

export async function reorderGalleryImages(ids: string[]): Promise<Result<true>> {
  const supabase = requireSupabase();
  const { error } = await supabase.rpc("reorder_gallery_images", { p_ids: ids });
  if (!error) return { data: true, error: null };
  if (!missingRpc(error.message)) {
    return { data: null, error: describe(error) };
  }
  return patchOrders("gallery_images", ids);
}

/** Last resort before 0004 is applied: PATCH only `sort_order` on each id. */
async function patchOrders(
  table: "projects" | "project_images" | "gallery_images",
  ids: string[]
): Promise<Result<true>> {
  if (ids.length === 0) return { data: true, error: null };
  const supabase = requireSupabase();
  const results = await Promise.all(
    ids.map((id, sort_order) => supabase.from(table).update({ sort_order }).eq("id", id))
  );
  const first = results.find((r) => r.error);
  return {
    data: first?.error ? null : true,
    error: first?.error ? describe(first.error) : null,
  };
}

function missingRpc(message: string): boolean {
  return /could not find the function|PGRST202/i.test(message);
}
