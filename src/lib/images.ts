import { supabaseUrl } from "./env";
import type { ProjectKind } from "./db/types";
import { companionThumbPath, companionWebPath } from "./optimizeImage";

/**
 * Public delivery and validation for photographs.
 *
 * The database stores a `storage_path` (optimized WebP web master) and a
 * `thumbnail_path`. Crops are never baked into the file; `object-position` is
 * derived from focal-point percentages. Supabase Image Transformations are
 * not used — this project runs on the Free plan.
 */

export const PORTFOLIO_BUCKET = "portfolio";

/** 50 MiB source cap. The original is processed in the browser and not uploaded. */
export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const PREFIX: Record<ProjectKind, string> = {
  photography: "projects",
  flycam: "flycam",
  corporate: "corporate",
};

export function extensionFor(file: File): string | null {
  if (EXT_BY_TYPE[file.type]) return EXT_BY_TYPE[file.type];
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName === "jpeg" || fromName === "jpg") return "jpg";
  if (fromName === "png" || fromName === "webp" || fromName === "avif") return fromName;
  return null;
}

export function validateImageFile(file: File): string | null {
  const ext = extensionFor(file);
  const typeOk =
    (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type) || ext !== null;
  if (!typeOk) {
    return `${file.name}: use JPEG, PNG or WebP. AVIF is accepted when this browser can decode it.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `${file.name} is ${mb} MB. The source limit is 50 MB.`;
  }
  if (file.size === 0) return `${file.name} is empty.`;
  return null;
}

export interface DerivativePaths {
  id: string;
  web: string;
  thumb: string;
}

function derivativePaths(folder: string, id = crypto.randomUUID()): DerivativePaths {
  const safe = folder.replace(/^\/+|\/+$/g, "");
  return {
    id,
    web: `${safe}/web/${id}.webp`,
    thumb: `${safe}/thumb/${id}.webp`,
  };
}

/** Immutable web + thumb paths for a project photograph. */
export function buildProjectDerivativePaths(kind: ProjectKind, slug: string): DerivativePaths {
  const folder = PREFIX[kind];
  const safeSlug = slug || "untitled";
  return derivativePaths(`${folder}/${safeSlug}`);
}

export type SiteImageSlot = "hero" | "about" | "contact" | "og" | "favicon";

/** Immutable web + thumb paths under `site/<slot>` or a custom folder. */
export function buildSiteDerivativePaths(slot: SiteImageSlot | string): DerivativePaths {
  const folder = slot.includes("/") || slot.startsWith("site/") || slot === "gallery"
    ? slot === "gallery"
      ? "gallery"
      : slot.includes("/")
        ? slot
        : `site/${slot}`
    : `site/${slot}`;
  return derivativePaths(folder);
}

/** @deprecated Prefer buildProjectDerivativePaths — kept for any leftover callers. */
export function buildStoragePath(kind: ProjectKind, slug: string, _file?: File): string {
  return buildProjectDerivativePaths(kind, slug).web;
}

/** @deprecated Prefer buildSiteDerivativePaths. */
export function buildSiteImagePath(slot: SiteImageSlot | string, _file?: File): string {
  return buildSiteDerivativePaths(slot).web;
}

/**
 * Object-position for a managed photograph. Centre (50/50) returns undefined so
 * the public site keeps the CSS default and stays pixel-identical to static.
 */
export function managedObjectPosition(
  focalX?: number | null,
  focalY?: number | null
): string | undefined {
  if (focalX == null && focalY == null) return undefined;
  const x = focalX ?? 50;
  const y = focalY ?? 50;
  if (x === 50 && y === 50) return undefined;
  return objectPosition(x, y);
}

/**
 * Resolves a stored path or leftover external URL to something an <img> can load.
 * Never returns a Supabase Image Transformation URL.
 */
export function imageUrl(storagePath: string | null, externalUrl?: string | null): string {
  if (externalUrl) return externalUrl;
  if (!storagePath) return "";
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${PORTFOLIO_BUCKET}/${storagePath}`;
}

/** Admin-list URL: thumbnail first, then a derived companion, then the web asset. */
export function thumbUrl(
  storagePath: string | null | undefined,
  thumbnailPath?: string | null,
  externalUrl?: string | null
): string {
  if (thumbnailPath) return imageUrl(thumbnailPath);
  const derived = companionThumbPath(storagePath);
  if (derived) return imageUrl(derived);
  return imageUrl(storagePath ?? null, externalUrl);
}

export function managedAssetPaths(
  storagePath: string | null | undefined,
  thumbnailPath?: string | null
): string[] {
  const paths = [
    storagePath,
    thumbnailPath,
    companionThumbPath(storagePath),
    companionWebPath(storagePath),
    companionThumbPath(thumbnailPath),
    companionWebPath(thumbnailPath),
  ].filter((path): path is string => Boolean(path));
  return [...new Set(paths)];
}

export function needsOptimization(
  storagePath: string | null | undefined,
  thumbnailPath?: string | null
): boolean {
  if (!storagePath) return false;
  if (thumbnailPath) return false;
  if (companionThumbPath(storagePath)) return false;
  return true;
}

/**
 * Admin preview URL. Unsplash placeholders keep their existing web-sized query
 * params. Managed photographs are never sent through `/render/image`.
 */
export function previewUrl(
  src: string,
  size: { width: number; height: number } = { width: 320, height: 400 }
): string {
  if (!src) return "";
  if (src.startsWith("blob:") || src.startsWith("data:")) return src;

  if (src.includes("images.unsplash.com")) {
    try {
      const url = new URL(src);
      url.searchParams.set("w", String(size.width));
      url.searchParams.set("h", String(size.height));
      url.searchParams.set("fit", "crop");
      url.searchParams.set("auto", "format");
      return url.toString();
    } catch {
      return src;
    }
  }

  return src;
}

export function objectPosition(focalX?: number | null, focalY?: number | null): string {
  const x = clampPercent(focalX ?? 50);
  const y = clampPercent(focalY ?? 50);
  return `${x}% ${y}%`;
}

function clampPercent(n: number): number {
  if (Number.isNaN(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

export function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(url);
      resolve(width > 0 && height > 0 ? { width, height } : null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
