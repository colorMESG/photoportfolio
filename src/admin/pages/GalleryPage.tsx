import { useCallback, useEffect, useRef, useState } from "react";
import { staticGalleryPhotos } from "../../lib/content/staticCatalog";
import {
  deleteGalleryImage,
  insertGalleryImage,
  listGalleryImages,
  nextGallerySortOrder,
  publishGalleryImages,
  updateGalleryImage,
} from "../../lib/db/gallery";
import { reorderGalleryImages } from "../../lib/db/reorder";
import type { GalleryImageRow } from "../../lib/db/types";
import {
  ALLOWED_IMAGE_TYPES,
  managedAssetPaths,
  needsOptimization,
  objectPosition,
  thumbUrl,
  validateImageFile,
} from "../../lib/images";
import { STAGE_LABEL } from "../../lib/optimizeImage";
import { deleteStoredObjects } from "../../lib/storage";
import {
  derivativeColumns,
  reoptimizeStoredPhotograph,
  siteUploadPaths,
  uploadOptimizedPhotograph,
} from "../../lib/uploadPhotograph";
import { Button, ErrorNote, TextInput, Toggle } from "../components/Form";
import { OptimizeReport, StoredOptimizeNote, type InflightUpload } from "../components/OptimizeReport";
import { PageHeader, ViewOnSite } from "../components/PageHeader";
import { DragHandle, SortableList } from "../components/SortableList";
import { SourceBadge, Thumb } from "../components/Thumb";

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImageRow[]>([]);
  const [inflight, setInflight] = useState<InflightUpload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [optimizingAll, setOptimizingAll] = useState(false);
  const [fileOver, setFileOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrls = useRef<string[]>([]);

  const load = useCallback(async () => {
    const { data, error: err } = await listGalleryImages();
    if (err) setError(err);
    setImages(data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const urls = previewUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  function patchInflight(key: string, patch: Partial<InflightUpload>) {
    setInflight((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  async function handleFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0) return;
    setError(null);
    setStatus(null);

    const accepted: File[] = [];
    const rejections: string[] = [];
    for (const file of files) {
      const reason = validateImageFile(file);
      if (reason) rejections.push(reason);
      else accepted.push(file);
    }
    if (rejections.length) setError(rejections.join(" "));
    if (accepted.length === 0) return;

    const pending: InflightUpload[] = accepted.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name,
      preview: null,
      stage: "preparing",
      percent: 0,
      error: null,
      optimized: null,
    }));
    setInflight((current) => [...current, ...pending]);

    let sort = await nextGallerySortOrder();

    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i];
      accepted[i] = undefined as unknown as File;
      const item = pending[i];
      const paths = siteUploadPaths("gallery");
      const { data, error: uploadError } = await uploadOptimizedPhotograph({
        file,
        paths,
        onStage: (stage, extra) => {
          patchInflight(item.key, { stage, percent: extra?.percent ?? 0 });
        },
      });
      if (uploadError || !data) {
        patchInflight(item.key, {
          error: uploadError ?? "Optimization failed.",
        });
        continue;
      }

      const thumbPreview = URL.createObjectURL(data.optimized.thumb);
      previewUrls.current.push(thumbPreview);
      patchInflight(item.key, {
        preview: thumbPreview,
        optimized: data.optimized,
        stage: "saving",
      });

      const { data: row, error: insertError } = await insertGalleryImage({
        alt: file.name.replace(/\.[^.]+$/, ""),
        caption: null,
        location: null,
        year: null,
        sort_order: sort,
        featured: false,
        published: false,
        focal_point_x: 50,
        focal_point_y: 50,
        ...derivativeColumns(data),
      });
      sort += 1;

      if (insertError || !row) {
        await deleteStoredObjects([data.webPath, data.thumbPath]);
        patchInflight(item.key, {
          error: insertError ?? "Could not save that photograph.",
        });
        continue;
      }

      setInflight((current) => current.filter((entry) => entry.key !== item.key));
      setImages((current) => [...current, row]);
    }
  }

  async function savePatch(id: string, patch: Parameters<typeof updateGalleryImage>[1]) {
    const { data, error: err } = await updateGalleryImage(id, patch);
    if (err) return setError(err);
    if (data) setImages((current) => current.map((row) => (row.id === id ? data : row)));
  }

  async function optimizeRow(row: GalleryImageRow): Promise<string | null> {
    if (!row.storage_path) return "That photograph has no stored file.";
    const result = await reoptimizeStoredPhotograph({
      storagePath: row.storage_path,
      thumbnailPath: row.thumbnail_path,
      originalFilename: row.original_filename,
      paths: siteUploadPaths("gallery"),
    });
    if (result.error || !result.data) return result.error ?? "Optimization failed.";
    const { data, error: err } = await updateGalleryImage(row.id, derivativeColumns(result.data));
    if (err || !data) {
      await deleteStoredObjects([result.data.webPath, result.data.thumbPath]);
      return err ?? "Could not save optimized metadata.";
    }
    await deleteStoredObjects(result.previousPaths);
    setImages((current) => current.map((item) => (item.id === row.id ? data : item)));
    return null;
  }

  async function optimizeExisting(row: GalleryImageRow) {
    setBusyId(row.id);
    setError(null);
    const err = await optimizeRow(row);
    setBusyId(null);
    if (err) setError(err);
  }

  async function optimizeAllLegacy() {
    const legacy = images.filter((row) => needsOptimization(row.storage_path, row.thumbnail_path));
    if (legacy.length === 0) return;
    const ok = window.confirm(
      `Re-encode ${legacy.length} legacy photograph${legacy.length === 1 ? "" : "s"} into web + thumbnail WebP?`
    );
    if (!ok) return;
    setOptimizingAll(true);
    setError(null);
    const failures: string[] = [];
    for (const row of legacy) {
      setBusyId(row.id);
      const err = await optimizeRow(row);
      if (err) failures.push(`${row.original_filename || row.alt || row.id}: ${err}`);
    }
    setBusyId(null);
    setOptimizingAll(false);
    if (failures.length) setError(failures.join(" "));
  }

  async function remove(row: GalleryImageRow) {
    const ok = window.confirm("Delete this photograph? The web and thumbnail files are removed too.");
    if (!ok) return;
    setBusyId(row.id);
    const { error: err } = await deleteGalleryImage(row.id);
    if (err) {
      setBusyId(null);
      return setError(err);
    }
    await deleteStoredObjects(managedAssetPaths(row.storage_path, row.thumbnail_path));
    setImages((current) => current.filter((item) => item.id !== row.id));
    setBusyId(null);
  }

  async function publish() {
    setPublishing(true);
    setError(null);
    const { error: err } = await publishGalleryImages(images.map((row) => row.id));
    setPublishing(false);
    if (err) {
      setError(err);
      return;
    }
    setStatus("Published. Refresh the public gallery to see it.");
    await load();
  }

  const published = images.filter((row) => row.published);
  const showingManaged = published.length > 0;
  const legacyCount = images.filter((row) =>
    needsOptimization(row.storage_path, row.thumbnail_path)
  ).length;

  return (
    <>
      <PageHeader
        title="Personal Gallery"
        description="Upload, reorder and publish photographs for the public Personal Gallery. If no published managed photographs exist, the static set stays on the site."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ViewOnSite href="/#gallery" />
            {status && <span className="text-sm text-emerald-400">{status}</span>}
            <Button onClick={() => inputRef.current?.click()}>Upload photographs</Button>
            {legacyCount > 0 && (
              <Button disabled={optimizingAll} onClick={() => void optimizeAllLegacy()}>
                {optimizingAll ? "Optimizing…" : `Optimize all legacy images (${legacyCount})`}
              </Button>
            )}
            <Button variant="primary" disabled={publishing || images.length === 0} onClick={() => void publish()}>
              {publishing ? "Publishing…" : "Publish gallery"}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <section className="mb-10 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-neutral-200">Current website photographs</h2>
          <SourceBadge source={showingManaged ? "managed-supabase" : "static-current"} />
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(showingManaged
            ? published.map((row) => ({
                id: row.id,
                src: thumbUrl(row.storage_path, row.thumbnail_path, row.external_url),
                alt: row.alt,
              }))
            : staticGalleryPhotos
          ).map((photo, index) => (
            <li key={photo.id} className="space-y-2">
              <div className="relative aspect-[4/5] overflow-hidden border border-neutral-800 bg-neutral-900">
                <Thumb src={photo.src} alt={photo.alt} width={480} height={600} className="size-full" />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-1.5">
                  <span className="bg-neutral-950/75 px-1.5 py-0.5 font-mono text-[10px] text-neutral-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <SourceBadge source={showingManaged ? "managed-supabase" : "static"} />
                </div>
              </div>
              <p className="truncate text-xs text-neutral-400">{photo.alt}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        onDragOver={(event) => {
          event.preventDefault();
          setFileOver(true);
        }}
        onDragLeave={() => setFileOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setFileOver(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={`space-y-4 border border-dashed px-5 py-6 ${
          fileOver ? "border-neutral-500 bg-neutral-900/60" : "border-neutral-800"
        }`}
      >
        <h2 className="text-sm font-medium text-neutral-200">Managed photographs</h2>
        <p className="text-sm text-neutral-500">
          New uploads stay unpublished until you Publish. The browser writes a 2400px WebP
          and a 480px thumbnail — the original is not stored. Reorder with the handle.
          JPEG, PNG, WebP or AVIF, up to 50 MB. Static Unsplash plates are never copied
          into Storage.
        </p>

        <SortableList
          items={images}
          getId={(row) => row.id}
          onCommit={async (ids) => {
            const { error: err } = await reorderGalleryImages(ids);
            if (!err) await load();
            return err;
          }}
          onError={setError}
          className="space-y-4"
          renderItem={(row, { handleProps, dragging }) => (
            <article
              className={`grid gap-4 border border-neutral-800 bg-neutral-900/30 p-3 sm:grid-cols-[auto_140px_1fr] ${
                dragging ? "opacity-60" : ""
              }`}
            >
              <DragHandle {...handleProps} />
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
                <Thumb
                  src={thumbUrl(row.storage_path, row.thumbnail_path, row.external_url)}
                  alt={row.alt}
                  width={280}
                  height={350}
                  className="size-full"
                  objectPosition={objectPosition(row.focal_point_x, row.focal_point_y)}
                />
                <div className="absolute left-1.5 top-1.5">
                  <SourceBadge source="managed-supabase" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-xs text-neutral-400">
                  Alt
                  <TextInput value={row.alt} onChange={(v) => void savePatch(row.id, { alt: v })} />
                </label>
                <label className="block space-y-1 text-xs text-neutral-400">
                  Caption
                  <TextInput
                    value={row.caption ?? ""}
                    onChange={(v) => void savePatch(row.id, { caption: v || null })}
                  />
                </label>
                <label className="block space-y-1 text-xs text-neutral-400">
                  Location
                  <TextInput
                    value={row.location ?? ""}
                    onChange={(v) => void savePatch(row.id, { location: v || null })}
                  />
                </label>
                <label className="block space-y-1 text-xs text-neutral-400">
                  Year
                  <TextInput
                    value={row.year ?? ""}
                    onChange={(v) => void savePatch(row.id, { year: v || null })}
                  />
                </label>
                <Toggle
                  checked={row.published}
                  onChange={(v) => void savePatch(row.id, { published: v })}
                  label="Published"
                />
                <div className="flex flex-wrap items-end gap-2">
                  {needsOptimization(row.storage_path, row.thumbnail_path) && (
                    <Button
                      disabled={busyId === row.id || optimizingAll}
                      onClick={() => void optimizeExisting(row)}
                    >
                      {busyId === row.id ? "Optimizing…" : "Optimize existing image"}
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    disabled={busyId === row.id}
                    onClick={() => void remove(row)}
                  >
                    Delete
                  </Button>
                </div>
                <div className="sm:col-span-2">
                  <StoredOptimizeNote
                    filename={row.original_filename}
                    sourceWidth={row.source_width}
                    sourceHeight={row.source_height}
                    sourceBytes={row.source_bytes}
                    webWidth={row.width}
                    webHeight={row.height}
                    webBytes={row.web_bytes}
                    thumbBytes={row.thumbnail_bytes}
                  />
                </div>
              </div>
            </article>
          )}
        />

        {inflight.map((item) => (
          <div key={item.key} className="flex items-center gap-4 border border-neutral-800 p-3">
            <div className="aspect-[4/5] w-20 overflow-hidden bg-neutral-900">
              {item.preview ? (
                <Thumb src={item.preview} alt={item.name} width={160} height={200} className="size-full" eager />
              ) : (
                <div className="flex size-full items-center justify-center px-1 text-center font-mono text-[10px] text-neutral-500">
                  {STAGE_LABEL[item.stage]}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <OptimizeReport
                sourceName={item.name}
                stage={item.error ? null : item.stage}
                percent={item.percent}
                optimized={item.optimized}
                error={item.error}
              />
            </div>
          </div>
        ))}
      </section>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </>
  );
}
