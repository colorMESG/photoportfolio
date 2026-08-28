import { requireSupabase } from "../supabase";
import type { Result } from "./projects";
import type { ProjectKind, ProjectVisibilityRow } from "./types";

function describe(error: { code?: string; message: string }): string {
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "The database refused this write. The signed-in account is not an administrator.";
  }
  if (
    error.code === "42P01" ||
    /project_visibility_overrides/i.test(error.message)
  ) {
    return "Visibility overrides are missing. Run supabase/migrations/0008_project_visibility_overrides.sql in the SQL Editor.";
  }
  return error.message;
}

export async function listVisibility(
  kind?: ProjectKind
): Promise<Result<ProjectVisibilityRow[]>> {
  let query = requireSupabase().from("project_visibility_overrides").select("*");
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  return {
    data: (data as ProjectVisibilityRow[]) ?? null,
    error: error ? describe(error) : null,
  };
}

export async function setProjectVisible(
  kind: ProjectKind,
  slug: string,
  visible: boolean
): Promise<Result<ProjectVisibilityRow>> {
  const { data, error } = await requireSupabase()
    .from("project_visibility_overrides")
    .upsert({ kind, slug, visible }, { onConflict: "kind,slug" })
    .select()
    .single();
  return {
    data: (data as ProjectVisibilityRow) ?? null,
    error: error ? describe(error) : null,
  };
}

export function hiddenKeySet(rows: ProjectVisibilityRow[] | null | undefined): Set<string> {
  const hidden = new Set<string>();
  for (const row of rows ?? []) {
    if (row.visible === false) hidden.add(`${row.kind}:${row.slug}`);
  }
  return hidden;
}
