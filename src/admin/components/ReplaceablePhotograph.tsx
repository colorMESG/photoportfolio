import { useEffect, useRef, useState } from "react";
import {
  blankContentImage,
  type ContentImageDraft,
} from "../../lib/content/siteCopy";
import {
  ALLOWED_IMAGE_TYPES,
  managedAssetPaths,
  needsOptimization,
  thumbUrl,
  validateImageFile,
} from "../../lib/images";
import type { OptimizeStage, OptimizedPair } from "../../lib/optimizeImage";
import {
  reoptimizeStoredPhotograph,
  siteUploadPaths,
  uploadOptimizedPhotograph,
  type PhotographUpload,
} from "../../lib/uploadPhotograph";
import { Button, ErrorNote, Field, TextInput } from "./Form";
import { OptimizeReport, StoredOptimizeNote } from "./OptimizeReport";
import { SourceBadge, Thumb } from "./Thumb";

function applyUpload(image: ContentImageDraft, upload: PhotographUpload): ContentImageDraft {
  const { optimized } = upload;
  return {
    ...image,
    image_path: upload.webPath,
    image_thumb_path: upload.thumbPath,
    image_width: optimized.webWidth,
    image_height: optimized.webHeight,
    original_filename: optimized.originalFilename,
    source_width: optimized.sourceWidth,
    source_height: optimized.sourceHeight,
    source_bytes: optimized.sourceBytes,
    web_bytes: optimized.webBytes,
    thumbnail_bytes: optimized.thumbBytes,
  };
}

/**
 * One site photograph the public page currently renders, plus a way to replace
 * it. The static Unsplash plate is never uploaded — only a file the editor
 * chooses is optimized in the browser and stored as WebP derivatives.
 */
export default function ReplaceablePhotograph({
  title,
  slot,
  viewHref,
  staticSrc,
  staticAlt,
  image,
  onChange,
}: {
  title: string;
  slot: string;
  viewHref?: string;
  staticSrc: string;
  staticAlt: string;
  image: ContentImageDraft;
  onChange: (next: ContentImageDraft, orphanPaths?: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [fileOver, setFileOver] = useState(false);
  const [stage, setStage] = useState<OptimizeStage | null>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [optimized, setOptimized] = useState<OptimizedPair | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function setPreview(url: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setLocalPreview(url);
  }

  const managed = Boolean(image.image_path);
  const shownSrc =
    localPreview ||
    (image.image_path
      ? thumbUrl(image.image_path, image.image_thumb_path)
      : staticSrc);
  const busy = Boolean(stage && stage !== "done" && !error);
  const legacy = needsOptimization(image.image_path, image.image_thumb_path);

  function onStage(next: OptimizeStage, extra?: { percent?: number }) {
    setStage(next);
    setPercent(extra?.percent ?? null);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const reason = validateImageFile(file);
    if (reason) {
      setError(reason);
      return;
    }

    setError(null);
    setOptimized(null);
    setPreview(null);
    onStage("preparing");

    const previous = managedAssetPaths(image.image_path, image.image_thumb_path);
    const paths = siteUploadPaths(slot);
    const { data, error: uploadError } = await uploadOptimizedPhotograph({
      file,
      paths,
      onStage,
    });

    if (uploadError || !data) {
      setError(uploadError ?? "Optimization failed.");
      setStage(null);
      setPercent(null);
      setPreview(null);
      return;
    }

    setPreview(URL.createObjectURL(data.optimized.thumb));
    setOptimized(data.optimized);
    onStage("saving");
    onChange(applyUpload(image, data), previous.length ? previous : undefined);
    setStage("done");
    setPercent(100);
  }

  async function optimizeExisting() {
    if (!image.image_path) return;
    setError(null);
    setOptimized(null);
    onStage("preparing");
    const paths = siteUploadPaths(slot);
    const { data, error: optimizeError, previousPaths } = await reoptimizeStoredPhotograph({
      storagePath: image.image_path,
      thumbnailPath: image.image_thumb_path,
      originalFilename: image.original_filename,
      paths,
      onStage,
    });
    if (optimizeError || !data) {
      setError(optimizeError ?? "Optimization failed.");
      setStage(null);
      setPercent(null);
      return;
    }
    setPreview(URL.createObjectURL(data.optimized.thumb));
    setOptimized(data.optimized);
    onStage("saving");
    onChange(applyUpload(image, data), previousPaths);
    setStage("done");
    setPercent(100);
  }

  function removeReplacement() {
    if (!image.image_path) return;
    setError(null);
    const previous = managedAssetPaths(image.image_path, image.image_thumb_path);
    setPreview(null);
    setPercent(null);
    setStage(null);
    setOptimized(null);
    onChange(
      {
        ...blankContentImage(image.image_alt),
        image_alt: image.image_alt,
        focal_point_x: image.focal_point_x ?? 50,
        focal_point_y: image.focal_point_y ?? 50,
      },
      previous
    );
  }

  return (
    <div className="space-y-4" data-content-image={slot}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-neutral-200">{title}</h3>
        <SourceBadge source={managed ? "managed-supabase" : "static-current"} />
      </div>

      <div
        className={`relative aspect-[3/4] max-w-[220px] overflow-hidden border bg-neutral-900 ${
          fileOver ? "border-neutral-500" : "border-neutral-800"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setFileOver(true);
        }}
        onDragLeave={() => setFileOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setFileOver(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
      >
        <Thumb
          key={shownSrc}
          src={shownSrc}
          alt={image.image_alt || staticAlt}
          width={440}
          height={586}
          className="size-full"
          eager
        />
        {busy && (
          <div className="absolute inset-x-0 bottom-0 bg-neutral-950/80 px-2 py-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
              <div className="h-full bg-neutral-200" style={{ width: `${percent ?? 8}%` }} />
            </div>
          </div>
        )}
      </div>

      <Field label="Alt text">
        <TextInput
          value={image.image_alt}
          onChange={(value) => onChange({ ...image, image_alt: value })}
          placeholder={staticAlt}
        />
      </Field>

      {error && <ErrorNote>{error}</ErrorNote>}

      {(stage || optimized) && (
        <OptimizeReport
          sourceName={image.original_filename || image.image_alt || title}
          stage={stage}
          percent={percent}
          optimized={optimized}
          error={error}
        />
      )}

      {!optimized && managed && (
        <StoredOptimizeNote
          filename={image.original_filename}
          sourceWidth={image.source_width}
          sourceHeight={image.source_height}
          sourceBytes={image.source_bytes}
          webWidth={image.image_width}
          webHeight={image.image_height}
          webBytes={image.web_bytes}
          thumbBytes={image.thumbnail_bytes}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => inputRef.current?.click()} disabled={busy}>
          Replace photograph
        </Button>
        {managed && legacy && (
          <Button onClick={() => void optimizeExisting()} disabled={busy}>
            Optimize existing image
          </Button>
        )}
        {managed && (
          <Button onClick={removeReplacement} disabled={busy}>
            Remove replacement
          </Button>
        )}
        {viewHref && (
          <a
            href={viewHref}
            className="text-sm text-neutral-400 transition-colors hover:text-neutral-200"
          >
            View on site ↗
          </a>
        )}
        <p className="text-xs text-neutral-500">
          Drop a file on the preview, or choose one. JPEG, PNG, WebP or AVIF, up to 50 MB.
          The original is not uploaded — the browser writes a 2400px WebP and a 480px
          thumbnail. The current static photograph is never copied into Storage.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
