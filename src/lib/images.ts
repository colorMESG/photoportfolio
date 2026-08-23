import { supabaseUrl } from "./env";
import type { ProjectKind } from "./db/types";

/**
 * Public delivery and validation for photographs.
 *
 * The database stores a `storage_path` (or, during migration, an `external_url`),
 * never a full CDN URL. That keeps a later switch to Supabase image
 * transformation — `/storage/v1/render/image/public/portfolio/<path>?width=…` —
 * as a one-line change here rather than a data migration. Crops are never baked
 * into the path; `object-position` is derived from focal-point percentages.
 */

export const PORTFOLIO_BUCKET = "portfolio";

/** 50 MiB. Matches the default Supabase file-size limit; originals are not resized. */
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
    return `${file.name}: use JPEG, PNG, WebP or AVIF.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `${file.name} is ${mb} MB. The limit is 50 MB, and originals are not compressed.`;
  }
  if (file.size === 0) return `${file.name} is empty.`;
  return null;
}

/** Folder + unique filename. UUIDs avoid collisions if two files share a name. */
export function buildStoragePath(kind: ProjectKind, slug: string, file: File): string {
  const ext = extensionFor(file) ?? "jpg";
  const id = crypto.randomUUID();
  const folder = PREFIX[kind];
  const safeSlug = slug || "untitled";
  return `${folder}/${safeSlug}/${id}.${ext}`;
}

/**
 * Resolves a stored path or leftover external URL to something an <img> can load.
 * When a transform pipeline lands, this is the only function that should change.
 */
export function imageUrl(storagePath: string | null, externalUrl?: string | null): string {
  if (externalUrl) return externalUrl;
  if (!storagePath) return "";
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${PORTFOLIO_BUCKET}/${storagePath}`;
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
