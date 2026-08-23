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
  buildStoragePath,
  imageUrl,
  objectPosition,
  readImageSize,
  validateImageFile,
} from "../../lib/images";
import { deleteStoredObject, uploadOriginal } from "../../lib/storage";
import { Button, ErrorNote, TextInput, Toggle } from "./Form";
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

interface InFlight {
  key: string;
  name: string;
  preview: string;
  percent: number;
  error: string | null;
}

const ImageManager = forwardRef<ImageManagerHandle, Props>(function ImageManager(
  { projectId, slug, kind, coverImageId, onCoverChange },
  ref
) {
  const [images, setImages] = useState<ProjectImageRow[]>([]);
  const [inflight, setInflight] = useState<InFlight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
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

    let sort = await nextImageSortOrder(projectId);
    let cover = coverImageId;

    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i];
      const item = pending[i];
      const path = buildStoragePath(kind, slug, file);

      const { error: uploadError } = await uploadOriginal(path, file, (progress) => {
        setInflight((current) =>
          current.map((row) =>
            row.key === item.key ? { ...row, percent: progress.percent } : row
          )
        );
      });

      if (uploadError) {
        setInflight((current) =>
          current.map((row) =>
            row.key === item.key ? { ...row, error: uploadError } : row
          )
        );
        continue;
      }

      const size = await readImageSize(file);
      const { data, error: insertError } = await insertProjectImage({
        project_id: projectId,
        storage_path: path,
        alt: "",
        width: size?.width ?? null,
        height: size?.height ?? null,
        sort_order: sort,
        featured: false,
        focal_point_x: 50,
        focal_point_y: 50,
      });
      sort += 1;

      if (insertError || !data) {
        await deleteStoredObject(path);
        setInflight((current) =>
          current.map((row) =>
            row.key === item.key
              ? { ...row, error: insertError ?? "Could not save image metadata." }
              : row
          )
        );
        continue;
      }

      if (!cover) {
        const { error: coverError } = await updateProject(projectId, {
          cover_image_id: data.id,
        });
        if (!coverError) {
          cover = data.id;
          onCoverChange(data.id);
        }
      }

      URL.revokeObjectURL(item.preview);
      setInflight((current) => current.filter((row) => row.key !== item.key));
      setImages((current) => [...current, data]);
    }
  }

  async function savePatch(
    id: string,
    patch: Parameters<typeof updateProjectImage>[1]
  ) {
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

  async function remove(row: ProjectImageRow) {
    const ok = window.confirm("Delete this photograph? The original file is removed too.");
    if (!ok) return;
    setBusyId(row.id);
    const { error: err } = await deleteProjectImage(row.id);
    if (err) {
      setBusyId(null);
      return setError(err);
    }
    if (row.storage_path) await deleteStoredObject(row.storage_path);
    if (coverImageId === row.id) {
      onCoverChange(null);
      await updateProject(projectId, { cover_image_id: null });
    }
    setImages((current) => current.filter((item) => item.id !== row.id));
    setBusyId(null);
  }

  return (
    <section id="managed-photographs" className="max-w-4xl space-y-5">
      <header className="space-y-1">
        <h2 className="text-xl font-medium text-neutral-100">Managed photographs</h2>
        <p className="text-sm text-neutral-500">
          Uploads stored in Supabase. These are the photographs that will replace
          the static placeholders. JPEG, PNG, WebP or AVIF, up to 50 MB. Originals
          are not compressed.
        </p>
      </header>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={`border border-dashed px-5 py-8 text-center transition-colors ${
          dragging
            ? "border-neutral-500 bg-neutral-900/60"
            : "border-neutral-800 bg-neutral-900/20"
        }`}
      >
        {images.length === 0 && inflight.length === 0 && (
          <p className="mb-3 text-sm text-neutral-400">No managed photographs yet.</p>
        )}
        <p className="text-sm text-neutral-300">Drop photographs here, or</p>
        <div className="mt-3">
          <Button onClick={() => inputRef.current?.click()}>Choose files</Button>
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
        <ul className="grid gap-4 sm:grid-cols-2">
          {inflight.map((item) => (
            <li
              key={item.key}
              className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/40"
            >
              <div className="aspect-[4/5] bg-neutral-900">
                <img src={item.preview} alt="" className="size-full object-cover" />
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-xs text-neutral-400">{item.name}</p>
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full bg-neutral-200 transition-[width]"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                {item.error ? (
                  <p className="text-xs text-red-400">{item.error}</p>
                ) : (
                  <p className="text-xs text-neutral-500">{item.percent}%</p>
                )}
              </div>
            </li>
          ))}

          {images.map((row, index) => {
            const src = imageUrl(row.storage_path, row.external_url);
            const isCover = coverImageId === row.id;
            return (
              <li
                key={row.id}
                className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/40"
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
                    {isCover ? (
                      <span className="bg-neutral-950/80 px-1.5 py-0.5 text-[10px] tracking-wide text-neutral-100 uppercase">
                        Cover
                      </span>
                    ) : (
                      <span />
                    )}
                    <SourceBadge source="supabase" />
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
                  <p className="text-xs text-neutral-600">
                    {row.width && row.height ? `${row.width} × ${row.height}` : "Original"}
                  </p>
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
                    <Button
                      variant="danger"
                      disabled={busyId === row.id}
                      onClick={() => void remove(row)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
});

export default ImageManager;
