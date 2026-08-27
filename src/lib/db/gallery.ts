import { requireSupabase } from "../supabase";
import type { GalleryImageRow } from "./types";
import type { Result } from "./siteContent";

function describe(error: { code?: string; message: string }): string {
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "The database refused this write. The signed-in account is not an administrator.";
  }
  return error.message;
}

export async function listGalleryImages(): Promise<Result<GalleryImageRow[]>> {
  const { data, error } = await requireSupabase()
    .from("gallery_images")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return { data: (data as GalleryImageRow[]) ?? null, error: error ? describe(error) : null };
}

export async function insertGalleryImage(
  row: Pick<
    GalleryImageRow,
    | "storage_path"
    | "alt"
    | "caption"
    | "location"
    | "year"
    | "sort_order"
    | "featured"
    | "published"
    | "focal_point_x"
    | "focal_point_y"
  >
): Promise<Result<GalleryImageRow>> {
  const { data, error } = await requireSupabase()
    .from("gallery_images")
    .insert(row)
    .select()
    .single();
  return { data: (data as GalleryImageRow) ?? null, error: error ? describe(error) : null };
}

export async function updateGalleryImage(
  id: string,
  patch: Partial<
    Pick<
      GalleryImageRow,
      | "alt"
      | "caption"
      | "location"
      | "year"
      | "featured"
      | "published"
      | "focal_point_x"
      | "focal_point_y"
      | "sort_order"
    >
  >
): Promise<Result<GalleryImageRow>> {
  const { data, error } = await requireSupabase()
    .from("gallery_images")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return { data: (data as GalleryImageRow) ?? null, error: error ? describe(error) : null };
}

export async function deleteGalleryImage(id: string): Promise<Result<true>> {
  const { error } = await requireSupabase().from("gallery_images").delete().eq("id", id);
  return { data: error ? null : true, error: error ? describe(error) : null };
}

export async function publishGalleryImages(ids: string[]): Promise<Result<true>> {
  const listed = await listGalleryImages();
  if (listed.error || !listed.data) {
    return { data: null, error: listed.error ?? "Could not load gallery." };
  }
  const published = new Set(ids);
  const results = await Promise.all(
    listed.data.map((row) =>
      requireSupabase()
        .from("gallery_images")
        .update({ published: published.has(row.id) })
        .eq("id", row.id)
    )
  );
  const first = results.find((result) => result.error);
  return {
    data: first?.error ? null : true,
    error: first?.error ? describe(first.error) : null,
  };
}

export async function nextGallerySortOrder(): Promise<number> {
  const { data } = await requireSupabase()
    .from("gallery_images")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data as { sort_order?: number } | null)?.sort_order ?? -1) + 1;
}
