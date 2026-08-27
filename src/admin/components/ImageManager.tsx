import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  deleteProjectImage,
  insertProjectImage,
  listProjectImages,
  nextImageSortOrder,
  updateProjectImage,
} from "../../lib/db/images";
import { updateProject } from "../../lib/db/projects";
import type { ProjectImageRow, ProjectKind } from "../../lib/db/types";
import {
  ALLOWED_IMAGE_TYPES,
  managedAssetPaths,
  needsOptimization,
  objectPosition,
  thumbUrl,
  validateImageFile,
} from "../../lib/images";
import type { OptimizeStage } from "../../lib/optimizeImage";
import { STAGE_LABEL } from "../../lib/optimizeImage";
import { deleteStoredObjects } from "../../lib/storage";
import {
  derivativeColumns,
  projectUploadPaths,
  reoptimizeStoredPhotograph,
  uploadOptimizedPhotograph,
} from "../../lib/uploadPhotograph";
import { reorderProjectImages } from "../../lib/db/reorder";
import { Button, ErrorNote, TextInput, Toggle } from "./Form";
import { OptimizeReport, StoredOptimizeNote, type InflightUpload } from "./OptimizeReport";
import { DragHandle, SortableList } from "./SortableList";
import { SourceBadge, Thumb } from "./Thumb";

export interface ImageManagerHandle {
  openFilePicker: () => void;
}

interface Props {
  projectId: string;
  slug: string;
  kind: ProjectKind;
  coverImageId: string | null;
  onCoverChange: (id: string | null) => void;
}

const ImageManager = forwardRef<ImageManagerHandle, Props>(function ImageManager(
  { projectId, slug, kind, coverImageId, onCoverChange },
  ref
) {
  const [images, setImages] = useState<ProjectImageRow[]>([]);
  const [inflight, setInflight] = useState<InflightUpload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [optimizingAll, setOptimizingAll] = useState(false);
  const [fileOver, setFileOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrls = useRef<string[]>([]);

  useImperativeHandle(ref, () => ({
    openFilePicker: () => inputRef.current?.click(),
  }));

  const load = useCallback(async () => {
    const { data, error: err } = await listProjectImages(projectId);
    if (err) setError(err);
    setImages(data ?? []);
  }, [projectId]);

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

  function rememberPreview(url: string) {
    previewUrls.current.push(url);
  }

  async function handleFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0) return;
    setError(null);

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

    let sort = await nextImageSortOrder(projectId);
    let cover = coverImageId;

    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i];
      accepted[i] = undefined as unknown as File;
      const item = pending[i];
      const paths = projectUploadPaths(kind, slug);

      const { data, error: uploadError } = await uploadOptimizedPhotograph({
        file,
        paths,
        onStage: (stage, extra) => {
          patchInflight(item.key, {
            stage,
            percent: extra?.percent ?? 0,
          });
        },
      });

      if (uploadError || !data) {
        patchInflight(item.key, {
          error: uploadError ?? "Optimization failed.",
          stage: "preparing",
        });
        continue;
      }

      const thumbPreview = URL.createObjectURL(data.optimized.thumb);
      rememberPreview(thumbPreview);
      patchInflight(item.key, {
        preview: thumbPreview,
        optimized: data.optimized,
        stage: "saving",
      });

      const { data: row, error: insertError } = await insertProjectImage({
        project_id: projectId,
        alt: "",
        sort_order: sort,
        featured: false,
        focal_point_x: 50,
        focal_point_y: 50,
        ...derivativeColumns(data),
      });
      sort += 1;

      if (insertError || !row) {
        await deleteStoredObjects([data.webPath, data.thumbPath]);
        patchInflight(item.key, {
          error: insertError ?? "Could not save image metadata.",
        });
        continue;
      }

      if (!cover) {
        const { error: coverError } = await updateProject(projectId, {
          cover_image_id: row.id,
        });
        if (!coverError) {
          cover = row.id;
          onCoverChange(row.id);
        }
      }

      setInflight((current) => current.filter((entry) => entry.key !== item.key));
      setImages((current) => [...current, row]);
    }
  }

  async function savePatch(id: string, patch: Parameters<typeof updateProjectImage>[1]) {
    const { data, error: err } = await updateProjectImage(id, patch);
    if (err) return setError(err);
    if (data) setImages((current) => current.map((row) => (row.id === id ? data : row)));
  }

  async function setCover(id: string) {
    setBusyId(id);
    const { error: err } = await updateProject(projectId, { cover_image_id: id });
    setBusyId(null);
    if (err) return setError(err);
    onCoverChange(id);
  }

  async function optimizeRow(row: ProjectImageRow): Promise<string | null> {
    if (!row.storage_path) return "That photograph has no stored file.";
    const paths = projectUploadPaths(kind, slug);
    const result = await reoptimizeStoredPhotograph({
      storagePath: row.storage_path,
      thumbnailPath: row.thumbnail_path,
      originalFilename: row.original_filename,
      paths,
    });
    if (result.error || !result.data) return result.error ?? "Optimization failed.";
    const { data, error: err } = await updateProjectImage(row.id, derivativeColumns(result.data));
    if (err || !data) {
      await deleteStoredObjects([result.data.webPath, result.data.thumbPath]);
      return err ?? "Could not save optimized metadata.";
    }
    await deleteStoredObjects(result.previousPaths);
    setImages((current) => current.map((item) => (item.id === row.id ? data : item)));
    return null;
  }

  async function optimizeExisting(row: ProjectImageRow) {
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
      `Re-encode ${legacy.length} legacy photograph${legacy.length === 1 ? "" : "s"} into web + thumbnail WebP? The original Storage files are removed after each succeeds.`
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

  async function remove(row: ProjectImageRow) {
    const ok = window.confirm("Delete this photograph? The web and thumbnail files are removed too.");
    if (!ok) return;
    setBusyId(row.id);
    const { error: err } = await deleteProjectImage(row.id);
    if (err) {
      setBusyId(null);
      return setError(err);
    }
    await deleteStoredObjects(managedAssetPaths(row.storage_path, row.thumbnail_path));
    if (coverImageId === row.id) {
      onCoverChange(null);
      await updateProject(projectId, { cover_image_id: null });
    }
    setImages((current) => current.filter((item) => item.id !== row.id));
    setBusyId(null);
  }

  const legacyCount = images.filter((row) =>
    needsOptimization(row.storage_path, row.thumbnail_path)
  ).length;

  return (
    <section id="managed-photographs" className="max-w-4xl space-y-5">
      <header className="space-y-1">
        <h2 className="text-xl font-medium text-neutral-100">Managed photographs</h2>
        <p className="text-sm text-neutral-500">
          Uploads stored in Supabase as optimized WebP. The original file stays on your
          computer. Drag the handle to reorder — cover and featured stay put. JPEG, PNG,
          WebP or AVIF, up to 50 MB.
        </p>
      </header>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div
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
        className={`border border-dashed px-5 py-8 text-center transition-colors ${
          fileOver
            ? "border-neutral-500 bg-neutral-900/60"
            : "border-neutral-800 bg-neutral-900/20"
        }`}
      >
        {images.length === 0 && inflight.length === 0 && (
          <p className="mb-3 text-sm text-neutral-400">No managed photographs yet.</p>
        )}
        <p className="text-sm text-neutral-300">Drop photographs here, or</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => inputRef.current?.click()}>Choose files</Button>
          {legacyCount > 0 && (
            <Button disabled={optimizingAll} onClick={() => void optimizeAllLegacy()}>
              {optimizingAll ? "Optimizing…" : `Optimize all legacy images (${legacyCount})`}
            </Button>
          )}
        </div>
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
      </div>

      {(inflight.length > 0 || images.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {inflight.map((item) => (
            <div
              key={item.key}
              className="overflow-hidden border border-neutral-800 bg-neutral-900/40"
            >
              <div className="aspect-[4/5] bg-neutral-900">
                {item.preview ? (
                  <img src={item.preview} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center px-4 text-center text-xs text-neutral-500">
                    {STAGE_LABEL[item.stage as OptimizeStage]}
                  </div>
                )}
              </div>
              <div className="space-y-2 p-3">
                <OptimizeReport
                  sourceName={item.name}
                  stage={item.error ? null : item.stage}
                  percent={item.percent}
                  optimized={item.optimized}
                  error={item.error}
                />
                {!item.error && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full bg-neutral-200 transition-[width]"
                      style={{ width: `${Math.max(item.percent, 8)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {images.length > 0 && (
            <SortableList
              items={images}
              getId={(row) => row.id}
              disabled={images.length < 2}
              className="contents"
              onError={setError}
              onCommit={async (ids) => {
                const { error: err } = await reorderProjectImages(projectId, ids);
                if (err) return err;
                setImages((current) => {
                  const byId = new Map(current.map((row) => [row.id, row]));
                  return ids
                    .map((id) => byId.get(id))
                    .filter((row): row is ProjectImageRow => Boolean(row));
                });
                return null;
              }}
              renderItem={(row, { handleProps, dragging, index }) => {
                const src = thumbUrl(row.storage_path, row.thumbnail_path, row.external_url);
                const isCover = coverImageId === row.id;
                const legacy = needsOptimization(row.storage_path, row.thumbnail_path);
                return (
                  <div
                    className={`overflow-hidden border bg-neutral-900/40 ${
                      dragging
                        ? "border-neutral-500 ring-1 ring-neutral-400"
                        : "border-neutral-800"
                    }`}
                  >
                    <div className="relative aspect-[4/5] bg-neutral-900">
                      <Thumb
                        src={src}
                        alt={row.alt}
                        width={480}
                        height={600}
                        className="size-full"
                        eager={index < 2}
                        objectPosition={objectPosition(row.focal_point_x, row.focal_point_y)}
                      />
                      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-1.5">
                        <span className="bg-neutral-950/80 px-1.5 py-0.5 font-mono text-[10px] text-neutral-200">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <SourceBadge source="supabase" />
                      </div>
                      {isCover && (
                        <span className="absolute bottom-1.5 left-1.5 bg-neutral-950/80 px-1.5 py-0.5 text-[10px] tracking-wide text-neutral-100 uppercase">
                          Cover
                        </span>
                      )}
                      <div className="absolute bottom-1.5 right-1.5 rounded-sm bg-neutral-950/70">
                        <DragHandle {...handleProps} />
                      </div>
                    </div>
                    <div className="space-y-3 p-3">
                      <label className="block space-y-1">
                        <span className="text-xs tracking-wide text-neutral-500 uppercase">
                          Alt text
                        </span>
                        <TextInput
                          value={row.alt}
                          onChange={(value) =>
                            setImages((current) =>
                              current.map((item) =>
                                item.id === row.id ? { ...item, alt: value } : item
                              )
                            )
                          }
                          onBlur={(value) => void savePatch(row.id, { alt: value })}
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs tracking-wide text-neutral-500 uppercase">
                          Caption
                        </span>
                        <TextInput
                          value={row.caption ?? ""}
                          onChange={(value) =>
                            setImages((current) =>
                              current.map((item) =>
                                item.id === row.id ? { ...item, caption: value } : item
                              )
                            )
                          }
                          onBlur={(value) =>
                            void savePatch(row.id, {
                              caption: value.trim() ? value : null,
                            })
                          }
                        />
                      </label>
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
                      {!row.source_width && row.width && row.height && (
                        <p className="text-xs text-neutral-600">
                          {row.width} × {row.height}
                        </p>
                      )}
                      <Toggle
                        checked={row.featured}
                        onChange={(value) => {
                          setImages((current) =>
                            current.map((item) =>
                              item.id === row.id ? { ...item, featured: value } : item
                            )
                          );
                          void savePatch(row.id, { featured: value });
                        }}
                        label="Featured"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          disabled={isCover || busyId === row.id}
                          onClick={() => void setCover(row.id)}
                        >
                          {isCover ? "Cover photo" : "Use as cover"}
                        </Button>
                        {legacy && (
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
                    </div>
                  </div>
                );
              }}
            />
          )}
        </div>
      )}
    </section>
  );
});

export default ImageManager;
