import { useEffect, useRef, useState } from "react";
import type { ContentImageDraft } from "../../lib/content/siteCopy";
import {
  ALLOWED_IMAGE_TYPES,
  buildSiteImagePath,
  imageUrl,
  readImageSize,
  validateImageFile,
} from "../../lib/images";
import { uploadOriginal } from "../../lib/storage";
import { Button, ErrorNote, Field, TextInput } from "./Form";
import { SourceBadge, Thumb } from "./Thumb";

/**
 * One site photograph the public page currently renders, plus a way to replace
 * it. The static Unsplash plate is never uploaded — only a file the editor
 * chooses goes into Storage. Clearing the replacement returns to that plate.
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
  onChange: (next: ContentImageDraft, orphanPath?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [fileOver, setFileOver] = useState(false);
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

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
  const shownSrc = localPreview || (image.image_path ? imageUrl(image.image_path) : staticSrc);
  const uploading = percent !== null && percent < 100 && !error;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const reason = validateImageFile(file);
    if (reason) {
      setError(reason);
      return;
    }

    setError(null);
    setPercent(0);
    setPreview(URL.createObjectURL(file));

    const previous = image.image_path;
    const path = buildSiteImagePath(slot, file);
    const { error: uploadError } = await uploadOriginal(path, file, (progress) => {
      setPercent(progress.percent);
    });

    if (uploadError) {
      setError(uploadError);
      setPercent(null);
      setPreview(null);
      return;
    }

    const size = await readImageSize(file);
    onChange(
      {
        ...image,
        image_path: path,
        image_width: size?.width ?? null,
        image_height: size?.height ?? null,
        focal_point_x: image.focal_point_x ?? 50,
        focal_point_y: image.focal_point_y ?? 50,
      },
      previous && previous !== path ? previous : undefined
    );
    setPercent(100);
  }

  function removeReplacement() {
    if (!image.image_path) return;
    setError(null);
    const previous = image.image_path;
    setPreview(null);
    setPercent(null);
    onChange(
      {
        ...image,
        image_path: null,
        image_width: null,
        image_height: null,
        focal_point_x: 50,
        focal_point_y: 50,
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
        <Thumb key={shownSrc} src={shownSrc} alt={image.image_alt || staticAlt} width={440} height={586} className="size-full" eager />
        {uploading && (
          <div className="absolute inset-x-0 bottom-0 bg-neutral-950/80 px-2 py-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
              <div className="h-full bg-neutral-200" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1 font-mono text-[10px] text-neutral-400">{percent}%</p>
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

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
          Replace photograph
        </Button>
        {managed && (
          <Button onClick={removeReplacement} disabled={uploading}>
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
          Originals are not compressed. The current static photograph is never uploaded.
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
