/**
 * Row shapes for the portfolio tables, mirroring supabase/migrations/0001_init.sql.
 *
 * Written by hand rather than generated: the schema is small and stable, and this
 * keeps the toolchain free of a codegen step. If the two ever drift, the
 * verification scripts in .tmp-verify/ will surface it as a runtime failure.
 */

export type ProjectKind = "photography" | "flycam" | "corporate";
export type CorporateCategory = "headshot" | "event" | "team";

export const PROJECT_KINDS: ProjectKind[] = ["photography", "flycam", "corporate"];
export const CORPORATE_CATEGORIES: CorporateCategory[] = ["headshot", "event", "team"];

export interface ProjectRow {
  id: string;
  kind: ProjectKind;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  description: string | null;
  location: string | null;
  year: string | null;
  display_number: string | null;
  sort_order: number;
  cover_image_id: string | null;
  published: boolean;
  coordinates: string | null;
  altitude: string | null;
  client: string | null;
  corporate_category: CorporateCategory | null;
  created_at: string;
  updated_at: string;
}

/** The subset a form may write. Server-managed columns are excluded. */
export type ProjectDraft = Omit<ProjectRow, "id" | "created_at" | "updated_at">;

export interface ImageDerivativeFields {
  thumbnail_path: string | null;
  original_filename: string | null;
  source_width: number | null;
  source_height: number | null;
  source_bytes: number | null;
  web_bytes: number | null;
  thumbnail_bytes: number | null;
}

export interface ProjectImageRow extends ImageDerivativeFields {
  id: string;
  project_id: string;
  storage_path: string | null;
  external_url: string | null;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  focal_point_x: number;
  focal_point_y: number;
  sort_order: number;
  featured: boolean;
  camera: string | null;
  lens: string | null;
  exposure: string | null;
  display_title: string | null;
  display_subtitle: string | null;
  display_year: string | null;
  display_label: string | null;
  created_at: string;
}

export interface GalleryImageRow extends ImageDerivativeFields {
  id: string;
  storage_path: string | null;
  external_url: string | null;
  alt: string;
  caption: string | null;
  location: string | null;
  year: string | null;
  width: number | null;
  height: number | null;
  focal_point_x: number;
  focal_point_y: number;
  sort_order: number;
  featured: boolean;
  published: boolean;
  camera: string | null;
  lens: string | null;
  exposure: string | null;
  created_at: string;
}

export interface SiteSettingsRow {
  id: boolean;
  brand_name: string;
  subtitle: string | null;
  email: string | null;
  phone: string | null;
  phone_href: string | null;
  location: string | null;
  instagram_handle: string | null;
  instagram_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_path: string | null;
  year?: string | null;
  favicon_path?: string | null;
  index_public?: boolean;
  draft?: Record<string, unknown> | null;
  published_at?: string | null;
  updated_at: string;
}

export interface ContentBlockRow {
  key: string;
  data: Record<string, unknown>;
  published_data: Record<string, unknown> | null;
  published_at: string | null;
  updated_at: string;
}

export interface ProjectVisibilityRow {
  kind: ProjectKind;
  slug: string;
  visible: boolean;
  updated_at: string;
}

export interface ServiceRow extends ImageDerivativeFields {
  id: string;
  display_number: string | null;
  title: string;
  subtitle: string | null;
  storage_path: string | null;
  external_url: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

/** Human-readable labels for the admin UI. */
export const KIND_LABELS: Record<ProjectKind, string> = {
  photography: "Projects",
  flycam: "Flycam",
  corporate: "Corporate",
};
