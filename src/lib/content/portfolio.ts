/**
 * Public project photography resolution.
 *
 * First paint is the static snapshot in `src/content/`. After mount, published
 * Supabase projects overlay that snapshot, matched by `kind + slug`.
 *
 * Photographs are exclusive, never mixed or padded:
 *   published managed photographs exist → render that set only
 *   none → render the static fallback set
 *
 * Deleting every managed photograph restores the static fallback. Static
 * files in `src/content/` are never written or removed.
 *
 * Fetches PostgREST directly so supabase-js stays out of the public bundle.
 */

import type { AerialImage, CorporateProject, PhotographyProject, ProjectImage } from "../../content/types";
import type { ProjectImageRow, ProjectKind, ProjectRow } from "../db/types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "../env";
import { imageUrl } from "../images";

export interface ManagedProject {
  project: ProjectRow;
  images: ProjectImage[];
}

export type PortfolioOverlays = Record<string, ManagedProject>;

export function projectKey(kind: ProjectKind, slug: string): string {
  return `${kind}:${slug}`;
}

export function toPublicImage(row: ProjectImageRow): ProjectImage | null {
  // Public portfolio imagery uses the optimized WebP master (`storage_path`).
  // `external_url` is only a leftover placeholder from migration.
  const src = row.storage_path
    ? imageUrl(row.storage_path)
    : imageUrl(null, row.external_url);
  if (!src) return null;
  return {
    id: row.id,
    src,
    alt: row.alt ?? "",
    caption: row.caption ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    focalPointX: row.focal_point_x,
    focalPointY: row.focal_point_y,
    order: row.sort_order,
    featured: row.featured,
    displayTitle: nonempty(row.display_title),
    displaySubtitle: nonempty(row.display_subtitle),
    displayYear: nonempty(row.display_year),
    displayLabel: nonempty(row.display_label),
  };
}

function nonempty(value: string | null | undefined): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

function firstText(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const next = value?.trim();
    if (next) return next;
  }
  return "";
}

export function resolveCover(managed: ManagedProject | null, staticFallback?: ProjectImage): ProjectImage | undefined {
  if (!managed || managed.images.length === 0) return staticFallback;
  const byId = managed.project.cover_image_id
    ? managed.images.find((image) => image.id === managed.project.cover_image_id)
    : undefined;
  return byId ?? managed.images[0];
}

export function overlayPhotography(
  fallback: PhotographyProject,
  managed: ManagedProject | null
): PhotographyProject {
  if (!managed) return fallback;
  const { project, images } = managed;
  const next: PhotographyProject = {
    ...fallback,
    title: project.title || fallback.title,
    subtitle: project.subtitle || fallback.subtitle,
    year: project.year || fallback.year,
    location: project.location || fallback.location,
    displayNumber: project.display_number || fallback.displayNumber,
  };
  if (images.length === 0) return next;
  return {
    ...next,
    coverImage: resolveCover(managed),
    images: images.map((image, index) => ({
      ...image,
      exifIdx: image.exifIdx ?? fallback.images[index]?.exifIdx ?? 0,
    })),
  };
}

export function overlayCorporateList(
  fallback: CorporateProject[],
  managed: ManagedProject | null
): CorporateProject[] {
  if (!managed) return fallback;
  if (managed.images.length === 0) return fallback;
  // Sequential `sort_order` into existing cells. Cover is not remapped onto
  // index 0 — that would duplicate a later photograph in a multi-image grid.
  return managed.images.map((image, index) => {
    const slot = fallback[index];
    return {
      id: image.id,
      src: image.src,
      alt: image.alt || slot?.alt || "",
      category: firstText(image.displaySubtitle, slot?.category) || "",
      client:
        firstText(
          image.displayTitle,
          slot?.client,
          managed.project.client,
          managed.project.title
        ) || "",
      year: firstText(image.displayYear, slot?.year, managed.project.year) || undefined,
      focalPointX: image.focalPointX,
      focalPointY: image.focalPointY,
    };
  });
}

export function overlayCorporateItem(
  fallback: CorporateProject,
  managed: ManagedProject | null
): CorporateProject {
  if (!managed) return fallback;
  if (managed.images.length === 0) {
    return {
      ...fallback,
      client: managed.project.client || managed.project.title || fallback.client,
      year: managed.project.year || fallback.year,
    };
  }
  const image = resolveCover(managed) ?? managed.images[0];
  if (!image) return fallback;
  return {
    ...fallback,
    id: image.id,
    src: image.src,
    alt: image.alt || fallback.alt,
    category: firstText(image.displaySubtitle, fallback.category) || fallback.category,
    client:
      firstText(
        image.displayTitle,
        fallback.client,
        managed.project.client,
        managed.project.title
      ) || fallback.client,
    year:
      firstText(image.displayYear, fallback.year, managed.project.year) || fallback.year,
    focalPointX: image.focalPointX,
    focalPointY: image.focalPointY,
  };
}

export function overlayAerial(
  fallback: AerialImage,
  managed: ManagedProject | null
): AerialImage {
  if (!managed) return fallback;
  const { project } = managed;
  const meta: AerialImage = {
    ...fallback,
    title: project.title || fallback.title,
    region: project.location || fallback.region,
    altitude: project.altitude || fallback.altitude,
    coordinates: project.coordinates || fallback.coordinates,
  };
  if (managed.images.length === 0) return meta;
  const image = resolveCover(managed) ?? managed.images[0];
  return {
    ...meta,
    ...image,
    id: image.id,
    src: image.src,
    alt: image.alt || fallback.alt,
    title: firstText(image.displayTitle, project.title, fallback.title) || fallback.title,
    region: firstText(image.displaySubtitle, project.location, fallback.region) || fallback.region,
    altitude: firstText(image.displayLabel, project.altitude, fallback.altitude) || fallback.altitude,
    coordinates: project.coordinates || fallback.coordinates,
  };
}

/**
 * Loads published projects and their photographs. Returns null when Supabase
 * is unconfigured or unreachable so the caller keeps the static snapshot.
 */
export async function fetchPublishedPortfolio(): Promise<PortfolioOverlays | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const [projects, images] = await Promise.all([
      restRows<ProjectRow>("projects?published=eq.true&select=*"),
      restRows<ProjectImageRow>(
        "project_images?select=*&order=sort_order.asc,created_at.asc"
      ),
    ]);
    if (!projects) return null;

    const byProject = new Map<string, ProjectImage[]>();
    for (const row of images ?? []) {
      const image = toPublicImage(row);
      if (!image) continue;
      const list = byProject.get(row.project_id) ?? [];
      list.push(image);
      byProject.set(row.project_id, list);
    }

    const overlays: PortfolioOverlays = {};
    for (const project of projects) {
      const photos = (byProject.get(project.id) ?? []).slice().sort((a, b) => {
        return (a.order ?? 0) - (b.order ?? 0);
      });
      overlays[projectKey(project.kind, project.slug)] = {
        project,
        images: photos,
      };
    }
    return overlays;
  } catch {
    return null;
  }
}

export function overlaysEqual(a: PortfolioOverlays, b: PortfolioOverlays): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function restRows<T>(path: string): Promise<T[] | null> {
  const base = supabaseUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/rest/v1/${path}`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });
  if (!response.ok) return null;
  const json = (await response.json()) as T[];
  return Array.isArray(json) ? json : null;
}
