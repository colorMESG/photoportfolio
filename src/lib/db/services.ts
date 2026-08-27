import { requireSupabase } from "../supabase";
import type { ServiceRow } from "./types";
import type { Result } from "./siteContent";

function describe(error: { code?: string; message: string }): string {
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "The database refused this write. The signed-in account is not an administrator.";
  }
  return error.message;
}

export async function listServices(): Promise<Result<ServiceRow[]>> {
  const { data, error } = await requireSupabase()
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });
  return { data: (data as ServiceRow[]) ?? null, error: error ? describe(error) : null };
}

export async function upsertService(
  row: Partial<ServiceRow> & Pick<ServiceRow, "title" | "sort_order">
): Promise<Result<ServiceRow>> {
  const { data, error } = await requireSupabase()
    .from("services")
    .upsert(row)
    .select()
    .single();
  return { data: (data as ServiceRow) ?? null, error: error ? describe(error) : null };
}

export async function updateService(
  id: string,
  patch: Partial<
    Pick<
      ServiceRow,
      "display_number" | "title" | "subtitle" | "storage_path" | "thumbnail_path"
      | "sort_order" | "published"
      | "original_filename" | "source_width" | "source_height" | "source_bytes"
      | "web_bytes" | "thumbnail_bytes"
    >
  >
): Promise<Result<ServiceRow>> {
  const { data, error } = await requireSupabase()
    .from("services")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return { data: (data as ServiceRow) ?? null, error: error ? describe(error) : null };
}

export async function insertService(
  row: Pick<ServiceRow, "display_number" | "title" | "subtitle" | "sort_order" | "published">
): Promise<Result<ServiceRow>> {
  const { data, error } = await requireSupabase().from("services").insert(row).select().single();
  return { data: (data as ServiceRow) ?? null, error: error ? describe(error) : null };
}

export async function deleteService(id: string): Promise<Result<true>> {
  const { error } = await requireSupabase().from("services").delete().eq("id", id);
  return { data: error ? null : true, error: error ? describe(error) : null };
}

export async function publishAllServices(): Promise<Result<true>> {
  const { error } = await requireSupabase().from("services").update({ published: true }).neq("id", "00000000-0000-0000-0000-000000000000");
  return { data: error ? null : true, error: error ? describe(error) : null };
}
