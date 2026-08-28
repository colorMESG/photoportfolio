import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  extraPublicPhotographs,
  staticCover,
  staticProject,
  staticProjects,
  type StaticProjectRef,
} from "../../lib/content/staticCatalog";
import { listImagesForProjects } from "../../lib/db/images";
import { deleteProject, listProjects, setPublished } from "../../lib/db/projects";
import { reorderProjects } from "../../lib/db/reorder";
import { hiddenKeySet, listVisibility, setProjectVisible } from "../../lib/db/visibility";
import type { ProjectImageRow, ProjectKind, ProjectRow } from "../../lib/db/types";
import { managedAssetPaths, thumbUrl } from "../../lib/images";
import { deleteStoredObjects } from "../../lib/storage";
import { Badge, Button, ErrorNote } from "../components/Form";
import { PageHeader } from "../components/PageHeader";
import { DragHandle, SortableList, type HandleProps } from "../components/SortableList";
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

interface ListItem {
  key: string;
  slug: string;
  title: string;
  year: string | null;
  displayNumber: string | null;
  row: ProjectRow | null;
  catalog: StaticProjectRef | null;
  hidden: boolean;
}

function mergeList(
  kind: ProjectKind,
  rows: ProjectRow[],
  hidden: Set<string>
): ListItem[] {
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  const seen = new Set<string>();
  const items: ListItem[] = [];

  for (const catalog of staticProjects(kind)) {
    seen.add(catalog.slug);
    const row = bySlug.get(catalog.slug) ?? null;
    items.push(itemFrom(kind, catalog.slug, catalog, row, hidden));
  }
  const extras = rows
    .filter((row) => !seen.has(row.slug))
    .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
  for (const row of extras) {
    items.push(itemFrom(kind, row.slug, staticProject(kind, row.slug), row, hidden));
  }
  return items;
}

function itemFrom(
  kind: ProjectKind,
  slug: string,
  catalog: StaticProjectRef | null,
  row: ProjectRow | null,
  hidden: Set<string>
): ListItem {
  return {
    key: row?.id ?? `static:${slug}`,
    slug,
    title: row?.title || catalog?.title || slug,
    year: row?.year ?? catalog?.year ?? null,
    displayNumber: row?.display_number ?? catalog?.displayNumber ?? null,
    row,
    catalog,
    hidden: hidden.has(`${kind}:${slug}`),
  };
}

export default function ProjectsListPage({ kind }: { kind: ProjectKind }) {
  const copy = COPY[kind];
  const navigate = useNavigate();
  const [items, setItems] = useState<ListItem[] | null>(null);
  const [images, setImages] = useState<ProjectImageRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data, error: err }, visibility] = await Promise.all([
      listProjects(kind),
      listVisibility(kind),
    ]);
    if (err) {
      setError(err);
      setItems(mergeList(kind, [], hiddenKeySet(visibility.data)));
      return;
    }
    if (visibility.error) setError(visibility.error);
    const list = data ?? [];
    setItems(mergeList(kind, list, hiddenKeySet(visibility.data)));
    const { data: photos, error: photoErr } = await listImagesForProjects(
      list.map((row) => row.id)
    );
    if (photoErr) setError(photoErr);
    setImages(photos ?? []);
  }, [kind]);

  useEffect(() => {
    setItems(null);
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

  async function togglePublished(item: ListItem) {
    if (!item.row) return;
    setBusyKey(item.key);
    const { error: err } = await setPublished(item.row.id, !item.row.published);
    setBusyKey(null);
    if (err) return setError(err);
    await load();
  }

  async function hide(item: ListItem) {
    const ok = window.confirm(
      `Hide “${item.title}” from the public site?\n\nThe static fallback will not come back until you Restore. It stays in Admin.`
    );
    if (!ok) return;
    setBusyKey(item.key);
    const { error: err } = await setProjectVisible(kind, item.slug, false);
    setBusyKey(null);
    if (err) return setError(err);
    await load();
  }

  async function restore(item: ListItem) {
    setBusyKey(item.key);
    const { error: err } = await setProjectVisible(kind, item.slug, true);
    setBusyKey(null);
    if (err) return setError(err);
    await load();
  }

  async function remove(item: ListItem) {
    if (!item.row || item.catalog) return;
    const ok = window.confirm(
      `Delete “${item.title}”?\n\nIts managed photographs are removed from the database too. This cannot be undone.`
    );
    if (!ok) return;
    setBusyKey(item.key);
    const paths = (imagesByProject.get(item.row.id) ?? []).flatMap((image) =>
      managedAssetPaths(image.storage_path, image.thumbnail_path)
    );
    const { error: err } = await deleteProject(item.row.id);
    if (!err) await deleteStoredObjects(paths);
    setBusyKey(null);
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

      {items === null ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-neutral-800 px-5 py-10 text-center">
          <p className="text-sm text-neutral-400">{copy.empty}</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-neutral-600">
            Drag the handle to reorder managed rows. Static-only projects stay in this list even without a database row.
          </p>
          <SortableList
            items={items}
            getId={(item) => item.key}
            disabled={items.filter((item) => item.row).length < 2}
            className="divide-y divide-neutral-800 border border-neutral-800"
            onError={setError}
            onCommit={async (ids) => {
              const managedIds = ids.filter((id) => !id.startsWith("static:"));
              if (managedIds.length === 0) return null;
              const { error: err } = await reorderProjects(kind, managedIds);
              if (err) return err;
              setItems((current) => {
                if (!current) return current;
                const byKey = new Map(current.map((item) => [item.key, item]));
                return ids.map((id) => byKey.get(id)).filter((item): item is ListItem => Boolean(item));
              });
              return null;
            }}
            renderItem={(item, { handleProps, dragging }) => (
              <ProjectRow
                kind={kind}
                item={item}
                handleProps={handleProps}
                dragging={dragging}
                managed={item.row ? imagesByProject.get(item.row.id) ?? [] : []}
                busy={busyKey === item.key}
                onPublish={() => void togglePublished(item)}
                onHide={() => void hide(item)}
                onRestore={() => void restore(item)}
                onDelete={() => void remove(item)}
              />
            )}
          />
        </>
      )}
    </>
  );
}

function ProjectRow({
  kind,
  item,
  handleProps,
  dragging,
  managed,
  busy,
  onPublish,
  onHide,
  onRestore,
  onDelete,
}: {
  kind: ProjectKind;
  item: ListItem;
  handleProps: HandleProps;
  dragging: boolean;
  managed: ProjectImageRow[];
  busy: boolean;
  onPublish: () => void;
  onHide: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const staticPhotos = item.catalog?.images ?? [];
  const managedCover =
    managed.find((image) => image.id === item.row?.cover_image_id) ?? managed[0];
  const coverSrc = managedCover
    ? thumbUrl(managedCover.storage_path, managedCover.thumbnail_path, managedCover.external_url)
    : staticCover(kind, item.slug)?.src ?? "";

  const hasManaged = managed.length > 0;
  const photoCount = hasManaged ? managed.length : staticPhotos.length;
  const countLabel = `${photoCount} photograph${photoCount === 1 ? "" : "s"}`;
  const href = item.row ? item.row.id : `static/${item.slug}`;
  const hasStatic = Boolean(item.catalog);

  return (
    <div
      className={`group flex items-center gap-2 px-2 py-2.5 transition-colors sm:gap-4 sm:px-3 ${
        dragging
          ? "bg-neutral-800/80 ring-1 ring-neutral-500 ring-inset"
          : "hover:bg-neutral-900/70"
      }`}
    >
      {item.row ? <DragHandle {...handleProps} /> : <span className="inline-flex h-11 w-8 shrink-0" />}
      <Link to={href} className="shrink-0" tabIndex={-1}>
        <Thumb
          src={coverSrc}
          alt={item.title}
          width={160}
          height={200}
          className="h-[88px] w-[66px] border border-neutral-800"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="font-mono text-xs text-neutral-500">
            {item.displayNumber ?? "—"}
          </span>
          <Link
            to={href}
            className="truncate text-sm font-medium text-neutral-100 group-hover:text-white"
          >
            {item.title}
          </Link>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          <span>{item.year ?? "—"}</span>
          {item.hidden ? (
            <SourceBadge source="hidden" />
          ) : item.row?.published ? (
            <SourceBadge source="published" />
          ) : item.row ? (
            <Badge tone="off">Draft</Badge>
          ) : null}
          {hasManaged ? (
            <SourceBadge source="supabase" />
          ) : hasStatic ? (
            <SourceBadge source="static-fallback" />
          ) : null}
          <span>{countLabel}</span>
        </div>
        <p className="mt-1 text-xs text-neutral-600">
          {item.hidden
            ? hasStatic
              ? "HIDDEN · STATIC FALLBACK — not on the public site"
              : "HIDDEN — not on the public site"
            : hasManaged && item.row?.published
              ? `Live managed set (${managed.length}) · static fallback inactive`
              : hasManaged
                ? `Managed draft (${managed.length}) · public still uses static fallback`
                : hasStatic
                  ? `Static fallback (${staticPhotos.length})`
                  : "None"}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row">
        <Link
          to={href}
          className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-200 transition-colors hover:border-neutral-600 hover:text-white"
        >
          {item.row ? "Edit" : "Manage"}
        </Link>
        {item.row && (
          <Button disabled={busy} onClick={onPublish}>
            {item.row.published ? "Unpublish" : "Publish"}
          </Button>
        )}
        {hasStatic ? (
          item.hidden ? (
            <Button disabled={busy} onClick={onRestore}>
              Restore
            </Button>
          ) : (
            <Button disabled={busy} onClick={onHide}>
              Hide from public
            </Button>
          )
        ) : (
          <Button variant="danger" disabled={busy} onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>
    </div>
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
