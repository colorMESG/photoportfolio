import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  extraPublicPhotographs,
  staticCover,
  staticProject,
} from "../../lib/content/staticCatalog";
import { listImagesForProjects } from "../../lib/db/images";
import { deleteProject, listProjects, setPublished } from "../../lib/db/projects";
import type { ProjectImageRow, ProjectKind, ProjectRow } from "../../lib/db/types";
import { imageUrl } from "../../lib/images";
import { Badge, Button, ErrorNote } from "../components/Form";
import { PageHeader } from "../components/PageHeader";
import { SourceBadge, Thumb } from "../components/Thumb";

const COPY: Record<ProjectKind, { title: string; description: string; empty: string }> = {
  photography: {
    title: "Projects",
    description: "Editorial photography currently on the public site, and what you have uploaded to replace it.",
    empty: "No projects yet.",
  },
  flycam: {
    title: "Flycam",
    description: "Aerial plates on the public Flycam section.",
    empty: "No aerial projects yet.",
  },
  corporate: {
    title: "Corporate",
    description: "Headshots, events and team photographs on the public site.",
    empty: "No corporate projects yet.",
  },
};

export default function ProjectsListPage({ kind }: { kind: ProjectKind }) {
  const copy = COPY[kind];
  const navigate = useNavigate();
  const [rows, setRows] = useState<ProjectRow[] | null>(null);
  const [images, setImages] = useState<ProjectImageRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await listProjects(kind);
    if (err) {
      setError(err);
      setRows([]);
      return;
    }
    const list = data ?? [];
    setRows(list);
    const { data: photos, error: photoErr } = await listImagesForProjects(
      list.map((row) => row.id)
    );
    if (photoErr) setError(photoErr);
    setImages(photos ?? []);
  }, [kind]);

  useEffect(() => {
    setRows(null);
    void load();
  }, [load]);

  const imagesByProject = useMemo(() => {
    const map = new Map<string, ProjectImageRow[]>();
    for (const image of images) {
      const list = map.get(image.project_id) ?? [];
      list.push(image);
      map.set(image.project_id, list);
    }
    return map;
  }, [images]);

  async function togglePublished(row: ProjectRow) {
    setBusyId(row.id);
    const { error: err } = await setPublished(row.id, !row.published);
    setBusyId(null);
    if (err) return setError(err);
    await load();
  }

  async function remove(row: ProjectRow) {
    const ok = window.confirm(
      `Delete “${row.title}”?\n\nIts managed photographs are removed from the database too. This cannot be undone.`
    );
    if (!ok) return;
    setBusyId(row.id);
    const { error: err } = await deleteProject(row.id);
    setBusyId(null);
    if (err) return setError(err);
    await load();
  }

  return (
    <>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Button variant="primary" onClick={() => navigate("new")}>
            New project
          </Button>
        }
      />

      {error && (
        <div className="mb-5">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      {kind === "flycam" && (
        <ExtraStrip
          label="Also on the Flycam section"
          photos={extraPublicPhotographs.flycamFrames.map((frame) => ({
            id: frame.id,
            src: frame.src,
            alt: frame.label,
          }))}
        />
      )}
      {kind === "photography" && (
        <ExtraStrip
          label="Also composed on the site (collage & 35mm)"
          photos={[...extraPublicPhotographs.collage, ...extraPublicPhotographs.filmStrip]}
        />
      )}

      {rows === null ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-neutral-800 px-5 py-10 text-center">
          <p className="text-sm text-neutral-400">{copy.empty}</p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-800 border border-neutral-800">
          {rows.map((row) => (
            <ProjectRow
              key={row.id}
              row={row}
              managed={imagesByProject.get(row.id) ?? []}
              busy={busyId === row.id}
              onPublish={() => void togglePublished(row)}
              onDelete={() => void remove(row)}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function ProjectRow({
  row,
  managed,
  busy,
  onPublish,
  onDelete,
}: {
  row: ProjectRow;
  managed: ProjectImageRow[];
  busy: boolean;
  onPublish: () => void;
  onDelete: () => void;
}) {
  const staticRef = staticProject(row.kind, row.slug);
  const staticPhotos = staticRef?.images ?? [];
  const managedCover =
    managed.find((image) => image.id === row.cover_image_id) ?? managed[0];
  const coverSrc = managedCover
    ? imageUrl(managedCover.storage_path, managedCover.external_url)
    : staticCover(row.kind, row.slug)?.src ?? "";

  const hasManaged = managed.length > 0;
  const photoCount = hasManaged ? managed.length : staticPhotos.length;
  const countLabel = `${photoCount} photograph${photoCount === 1 ? "" : "s"}`;

  return (
    <li className="group flex items-center gap-4 px-3 py-2.5 transition-colors hover:bg-neutral-900/70">
      <Link to={row.id} className="shrink-0" tabIndex={-1}>
        <Thumb
          src={coverSrc}
          alt={row.title}
          width={160}
          height={200}
          className="h-[88px] w-[66px] border border-neutral-800"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="font-mono text-xs text-neutral-500">
            {row.display_number ?? "—"}
          </span>
          <Link
            to={row.id}
            className="truncate text-sm font-medium text-neutral-100 group-hover:text-white"
          >
            {row.title}
          </Link>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          <span>{row.year ?? "—"}</span>
          <Badge tone={row.published ? "on" : "off"}>
            {row.published ? "Published" : "Draft"}
          </Badge>
          <span>{countLabel}</span>
          {hasManaged ? (
            <SourceBadge source="supabase-new" />
          ) : staticPhotos.length > 0 ? (
            <SourceBadge source="static-current" />
          ) : null}
        </div>
        <p className="mt-1 text-xs text-neutral-600">
          Current source:{" "}
          {hasManaged
            ? "Supabase — intended to replace the static placeholders"
            : staticPhotos.length > 0
              ? "Static placeholder"
              : "None"}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row">
        <Link
          to={row.id}
          className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-200 transition-colors hover:border-neutral-600 hover:text-white"
        >
          Edit
        </Link>
        <Button disabled={busy} onClick={onPublish}>
          {row.published ? "Unpublish" : "Publish"}
        </Button>
        <Button variant="danger" disabled={busy} onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  );
}

function ExtraStrip({
  label,
  photos,
}: {
  label: string;
  photos: { id: string; src: string; alt: string }[];
}) {
  if (photos.length === 0) return null;
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-xs tracking-wide text-neutral-500 uppercase">{label}</h2>
        <SourceBadge source="static-current" />
      </div>
      <ul className="flex gap-1.5 overflow-x-auto pb-1">
        {photos.map((photo) => (
          <li key={photo.id} className="shrink-0" title={photo.alt}>
            <Thumb
              src={photo.src}
              alt={photo.alt}
              width={120}
              height={150}
              className="h-[72px] w-[54px] border border-neutral-800"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
