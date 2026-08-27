import {
  buildProjectDerivativePaths,
  buildSiteDerivativePaths,
  managedAssetPaths,
  type DerivativePaths,
} from "./images";
import type { ProjectKind } from "./db/types";
import {
  optimizePhotograph,
  type OptimizedPair,
  type OptimizeStage,
} from "./optimizeImage";
import { deleteStoredObjects, fetchStoredBlob, uploadOriginal } from "./storage";

export function derivativeColumns(upload: PhotographUpload) {
  const { optimized } = upload;
  return {
    storage_path: upload.webPath,
    thumbnail_path: upload.thumbPath,
    original_filename: optimized.originalFilename,
    source_width: optimized.sourceWidth,
    source_height: optimized.sourceHeight,
    source_bytes: optimized.sourceBytes,
    width: optimized.webWidth,
    height: optimized.webHeight,
    web_bytes: optimized.webBytes,
    thumbnail_bytes: optimized.thumbBytes,
  };
}

export interface PhotographUpload {
  webPath: string;
  thumbPath: string;
  optimized: OptimizedPair;
}

export type UploadStageHandler = (stage: OptimizeStage, extra?: { percent?: number }) => void;

async function uploadPair(
  paths: DerivativePaths,
  optimized: OptimizedPair,
  onStage?: UploadStageHandler
): Promise<{ error: string | null }> {
  onStage?.("uploading-web", { percent: 0 });
  const web = await uploadOriginal(paths.web, optimized.web, (progress) => {
    onStage?.("uploading-web", { percent: progress.percent });
  });
  if (web.error) return web;

  onStage?.("uploading-thumb", { percent: 0 });
  const thumb = await uploadOriginal(paths.thumb, optimized.thumb, (progress) => {
    onStage?.("uploading-thumb", { percent: progress.percent });
  });
  if (thumb.error) {
    await deleteStoredObjects([paths.web]);
    return thumb;
  }
  return { error: null };
}

export async function uploadOptimizedPhotograph(options: {
  file: File;
  paths: DerivativePaths;
  onStage?: UploadStageHandler;
}): Promise<{ data: PhotographUpload | null; error: string | null }> {
  const { file, paths, onStage } = options;
  onStage?.("preparing");
  let optimized: OptimizedPair;
  try {
    onStage?.("optimizing");
    optimized = await optimizePhotograph(file, file.name);
  } catch (err) {
    const message = err instanceof Error ? err.message : `${file.name}: optimization failed.`;
    return { data: null, error: message };
  }

  const uploaded = await uploadPair(paths, optimized, onStage);
  if (uploaded.error) return { data: null, error: uploaded.error };

  return {
    data: { webPath: paths.web, thumbPath: paths.thumb, optimized },
    error: null,
  };
}

export function projectUploadPaths(kind: ProjectKind, slug: string): DerivativePaths {
  return buildProjectDerivativePaths(kind, slug);
}

export function siteUploadPaths(slot: string): DerivativePaths {
  return buildSiteDerivativePaths(slot);
}

/**
 * Re-encode a photograph that is already in Storage (typically a full original
 * uploaded before this pipeline). The replacement is written first; the old
 * object is removed only after both derivatives succeed.
 */
export async function reoptimizeStoredPhotograph(options: {
  storagePath: string;
  thumbnailPath?: string | null;
  originalFilename?: string | null;
  paths: DerivativePaths;
  onStage?: UploadStageHandler;
}): Promise<{ data: PhotographUpload | null; error: string | null; previousPaths: string[] }> {
  const { storagePath, thumbnailPath, originalFilename, paths, onStage } = options;
  onStage?.("preparing");
  const downloaded = await fetchStoredBlob(storagePath);
  if (downloaded.error || !downloaded.data) {
    return {
      data: null,
      error: downloaded.error ?? "Could not download the existing photograph.",
      previousPaths: [],
    };
  }

  let optimized: OptimizedPair;
  try {
    onStage?.("optimizing");
    optimized = await optimizePhotograph(
      downloaded.data,
      originalFilename || storagePath.split("/").pop() || "photograph.jpg"
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Optimization failed.";
    return { data: null, error: message, previousPaths: [] };
  }

  const uploaded = await uploadPair(paths, optimized, onStage);
  if (uploaded.error) return { data: null, error: uploaded.error, previousPaths: [] };

  return {
    data: { webPath: paths.web, thumbPath: paths.thumb, optimized },
    error: null,
    previousPaths: managedAssetPaths(storagePath, thumbnailPath).filter(
      (path) => path !== paths.web && path !== paths.thumb
    ),
  };
}
