/**
 * Client-side photograph optimization for Supabase Free.
 *
 * Source files never go into Storage. The browser decodes the original, scales
 * it (no crop, no upscale) and encodes two WebP blobs: a web master (long edge
 * ≤ 2400) and a thumbnail (long edge ≤ 480). Processing is serial so a batch
 * of large JPEGs cannot decode all at once.
 */

export const WEB_MAX_EDGE = 2400;
export const THUMB_MAX_EDGE = 480;
export const WEB_QUALITY = 0.82;
export const THUMB_QUALITY = 0.7;

export type OptimizeStage =
  | "preparing"
  | "optimizing"
  | "uploading-web"
  | "uploading-thumb"
  | "saving"
  | "done";

export const STAGE_LABEL: Record<OptimizeStage, string> = {
  preparing: "Preparing image…",
  optimizing: "Optimizing…",
  "uploading-web": "Uploading web image…",
  "uploading-thumb": "Uploading thumbnail…",
  saving: "Saving metadata…",
  done: "Done",
};

export interface OptimizedPair {
  web: File;
  thumb: File;
  sourceWidth: number;
  sourceHeight: number;
  sourceBytes: number;
  originalFilename: string;
  webWidth: number;
  webHeight: number;
  webBytes: number;
  thumbWidth: number;
  thumbHeight: number;
  thumbBytes: number;
}

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const run = queue.then(work, work);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : mb.toFixed(1)} MB`;
}

export function formatPixels(width: number, height: number): string {
  return `${width} × ${height}`;
}

function fit(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const long = Math.max(width, height);
  if (long <= maxEdge) return { width, height };
  const scale = maxEdge / long;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function decodeBitmap(source: Blob, name: string): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(source, { imageOrientation: "from-image" });
  } catch {
    // Older engines, or a codec the browser cannot decode (often AVIF).
  }

  const url = URL.createObjectURL(source);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode"));
      img.src = url;
    });
    return await createImageBitmap(image);
  } catch {
    throw new Error(
      `${name}: this browser could not decode that file. Use JPEG, PNG or WebP.`
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function encodeWebp(
  bitmap: ImageBitmap,
  maxEdge: number,
  quality: number,
  filename: string
): Promise<{ file: File; width: number; height: number }> {
  const size = fit(bitmap.width, bitmap.height, maxEdge);
  let blob: Blob;

  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(size.width, size.height);
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error(`${filename}: could not open a drawing context.`);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    blob = await canvas.convertToBlob({ type: "image/webp", quality });
    canvas.width = 0;
    canvas.height = 0;
  } else {
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error(`${filename}: could not open a drawing context.`);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (next) => {
          if (next && next.size > 0) resolve(next);
          else reject(new Error(`${filename}: WebP encoding failed in this browser.`));
        },
        "image/webp",
        quality
      );
    });
    canvas.width = 0;
    canvas.height = 0;
  }

  if (!blob || blob.size === 0) {
    throw new Error(`${filename}: WebP encoding failed in this browser.`);
  }

  const file = new File([blob], filename, { type: "image/webp", lastModified: Date.now() });
  return { file, width: size.width, height: size.height };
}

/**
 * Decode one source photograph and produce the web + thumbnail WebP pair.
 * Callers must not hold the source File after this returns if they want it GC'd.
 */
export function optimizePhotograph(source: Blob, originalFilename: string): Promise<OptimizedPair> {
  return enqueue(async () => {
    const bitmap = await decodeBitmap(source, originalFilename);
    try {
      if (bitmap.width < 1 || bitmap.height < 1) {
        throw new Error(`${originalFilename}: the image has no pixels.`);
      }
      const id = crypto.randomUUID();
      const web = await encodeWebp(bitmap, WEB_MAX_EDGE, WEB_QUALITY, `${id}.webp`);
      const thumb = await encodeWebp(bitmap, THUMB_MAX_EDGE, THUMB_QUALITY, `${id}.thumb.webp`);
      return {
        web: web.file,
        thumb: thumb.file,
        sourceWidth: bitmap.width,
        sourceHeight: bitmap.height,
        sourceBytes: source.size,
        originalFilename,
        webWidth: web.width,
        webHeight: web.height,
        webBytes: web.file.size,
        thumbWidth: thumb.width,
        thumbHeight: thumb.height,
        thumbBytes: thumb.file.size,
      };
    } finally {
      bitmap.close();
    }
  });
}

export function isOptimizedWebPath(path: string | null | undefined): boolean {
  return Boolean(path && path.includes("/web/") && path.endsWith(".webp"));
}

/** Companion thumbnail path when both derivatives share the same UUID. */
export function companionThumbPath(webPath: string | null | undefined): string | null {
  if (!webPath) return null;
  if (!webPath.includes("/web/")) return null;
  return webPath.replace("/web/", "/thumb/");
}

/** Companion web-master path when a stored path points at the thumbnail. */
export function companionWebPath(thumbPath: string | null | undefined): string | null {
  if (!thumbPath) return null;
  if (!thumbPath.includes("/thumb/")) return null;
  return thumbPath.replace("/thumb/", "/web/");
}
