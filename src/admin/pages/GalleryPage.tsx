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
  buildSiteImagePath,
  imageUrl,
  objectPosition,
  readImageSize,
  validateImageFile,
} from "../../lib/images";
import { deleteStoredObject, uploadOriginal } from "../../lib/storage";
import { Button, ErrorNote, TextInput, Toggle } from "../components/Form";
import { PageHeader, ViewOnSite } from "../components/PageHeader";
import { DragHandle, SortableList } from "../components/SortableList";
import { SourceBadge, Thumb } from "../components/Thumb";

interface InFlight {
  key: string;
  name: string;
  preview: string;
  percent: number;
  error: string | null;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImageRow[]>([]);
  const [inflight, setInflight] = useState<InFlight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
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

    const pending: InFlight[] = accepted.map((file) => {
      const preview = URL.createObjectURL(file);
      previewUrls.current.push(preview);
      return {
        key: `${file.name}-${file.size}-${file.lastModified}-${preview}`,
        name: file.name,
        preview,
        percent: 0,
        error: null,
      };
    });
    setInflight((current) => [...current, ...pending]);

    let sort = await nextGallerySortOrder();

    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i];
      const item = pending[i];
      const path = buildSiteImagePath("gallery", file);
      const { error: uploadError } = await uploadOriginal(path, file, (progress) => {
        setInflight((current) =>
          current.map((row) => (row.key === item.key ? { ...row, percent: progress.percent } : row))
        );
      });
      if (uploadError) {
        setInflight((current) =>
          current.map((row) => (row.key === item.key ? { ...row, error: uploadError } : row))
        );
        continue;
      }
      const size = await readImageSize(file);
      const { data, error: insertError } = await insertGalleryImage({
        storage_path: path,
        alt: file.name.replace(/\.[^.]+$/, ""),
        caption: null,
        location: null,
        year: null,
        sort_order: sort,
        featured: false,
        published: false,
        focal_point_x: 50,
        focal_point_y: 50,
      });
      sort += 1;
      URL.revokeObjectURL(item.preview);
      setInflight((current) => current.filter((row) => row.key !== item.key));
      if (insertError || !data) {
        setError(insertError ?? "Could not save that photograph.");
        continue;
      }
      void size;
      setImages((current) => [...current, data]);
    }
  }

  async function savePatch(id: string, patch: Parameters<typeof updateGalleryImage>[1]) {
    const { data, error: err } = await updateGalleryImage(id, patch);
    if (err) return setError(err);
    if (data) setImages((current) => current.map((row) => (row.id === id ? data : row)));
  }

  async function remove(row: GalleryImageRow) {
    const ok = window.confirm("Delete this photograph? The original file is removed too.");
    if (!ok) return;
    setBusyId(row.id);
    const { error: err } = await deleteGalleryImage(row.id);
    if (err) {
      setBusyId(null);
      return setError(err);
    }
    if (row.storage_path) await deleteStoredObject(row.storage_path);
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
          <SourceBadge source={images.some((row) => row.published) ? "managed-supabase" : "static-current"} />
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(images.some((row) => row.published)
            ? images.filter((row) => row.published).map((row) => ({
                id: row.id,
                src: imageUrl(row.storage_path, row.external_url),
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
                  <SourceBadge source={images.some((row) => row.published) ? "managed-supabase" : "static"} />
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
          New uploads stay unpublished until you Publish. Reorder with the handle. JPEG, PNG, WebP or
          AVIF, up to 50 MB. The static Unsplash plates are never copied into Storage.
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
                  src={imageUrl(row.storage_path, row.external_url)}
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
                <div className="flex items-end">
                  <Button
                    variant="danger"
                    disabled={busyId === row.id}
                    onClick={() => void remove(row)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          )}
        />

        {inflight.map((item) => (
          <div key={item.key} className="flex items-center gap-4 border border-neutral-800 p-3">
            <div className="aspect-[4/5] w-20 overflow-hidden bg-neutral-900">
              <Thumb src={item.preview} alt={item.name} width={160} height={200} className="size-full" eager />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-neutral-200">{item.name}</p>
              {item.error ? (
                <p className="text-xs text-red-400">{item.error}</p>
              ) : (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-800">
                  <div className="h-full bg-neutral-200" style={{ width: `${item.percent}%` }} />
                </div>
              )}
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
