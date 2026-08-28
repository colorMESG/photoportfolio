import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { staticProject, staticProjects } from "../../lib/content/staticCatalog";
import {
  createProject,
  deleteProject,
  draftFromStatic,
  emptyProject,
  getProject,
  getProjectBySlug,
  listAllSlugs,
  nextSortOrder,
  updateProject,
} from "../../lib/db/projects";
import { listProjectImages } from "../../lib/db/images";
import { hiddenKeySet, listVisibility, setProjectVisible } from "../../lib/db/visibility";
import {
  CORPORATE_CATEGORIES,
  type CorporateCategory,
  type ProjectDraft,
  type ProjectKind,
} from "../../lib/db/types";
import { slugify, uniqueSlug } from "../../lib/slug";
import { managedAssetPaths } from "../../lib/images";
import { deleteStoredObjects } from "../../lib/storage";
import {
  Button,
  ErrorNote,
  Field,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from "../components/Form";
import { CurrentPhotographs } from "../components/CurrentPhotographs";
import ImageManager, { type ImageManagerHandle } from "../components/ImageManager";
import { PageHeader, ViewOnSite } from "../components/PageHeader";

/** Empty strings from a form become NULL rather than '' in the database. */
const nullify = (v: string): string | null => (v.trim() === "" ? null : v.trim());

export default function ProjectEditorPage({ kind }: { kind: ProjectKind }) {
  const { id, slug: routeSlug } = useParams<{ id?: string; slug?: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [rowId, setRowId] = useState<string | null>(isNew || routeSlug ? null : id ?? null);
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [takenSlugs, setTakenSlugs] = useState<string[]>([]);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const imagesRef = useRef<ImageManagerHandle>(null);
  const [managedCount, setManagedCount] = useState(0);
  const catalog = draft ? staticProject(kind, draft.slug) : routeSlug ? staticProject(kind, routeSlug) : null;
  const hasStatic = Boolean(catalog);
  const currentPhotos = catalog?.images ?? [];
  const fallbackInactive = Boolean(!hidden && draft?.published && managedCount > 0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [slugs, visibility] = await Promise.all([listAllSlugs(kind), listVisibility(kind)]);
      if (!alive) return;
      setTakenSlugs([...new Set([...slugs, ...staticProjects(kind).map((item) => item.slug)])]);
      const hiddenSlugs = hiddenKeySet(visibility.data);
      const visibilityWarning = visibility.error;

      if (isNew) {
        const order = await nextSortOrder(kind);
        if (alive) {
          setDraft(emptyProject(kind, order));
          if (visibilityWarning) setError(visibilityWarning);
        }
        return;
      }

      if (routeSlug) {
        setHidden(hiddenSlugs.has(`${kind}:${routeSlug}`));
        const existing = await getProjectBySlug(kind, routeSlug);
        if (!alive) return;
        if (existing.error) {
          setError(existing.error);
          return;
        }
        if (existing.data) {
          setRowId(existing.data.id);
          const { id: _id, created_at: _c, updated_at: _u, ...rest } = existing.data;
          setSlugTouched(true);
          setDraft(rest);
          if (visibilityWarning) setError(visibilityWarning);
          navigate(`../${existing.data.id}`, { replace: true });
          return;
        }
        const staticRef = staticProject(kind, routeSlug);
        if (!staticRef) {
          setError("That static project is not in the catalog.");
          return;
        }
        const order = await nextSortOrder(kind);
        if (!alive) return;
        setSlugTouched(true);
        setDraft(draftFromStatic(staticRef, order));
        if (visibilityWarning) setError(visibilityWarning);
        return;
      }

      const { data, error: err } = await getProject(id!);
      if (!alive) return;
      if (err || !data) {
        setError(err ?? "That project no longer exists.");
        return;
      }
      setRowId(data.id);
      setSlugTouched(true);
      setHidden(hiddenSlugs.has(`${kind}:${data.slug}`));
      const { id: _id, created_at: _c, updated_at: _u, ...rest } = data;
      setDraft(rest);
      if (visibilityWarning) setError(visibilityWarning);
    })();
    return () => {
      alive = false;
    };
  }, [id, isNew, kind, navigate, routeSlug]);

  const patch = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) => {
    setSaved(false);
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  };

  function onTitleChange(value: string) {
    setSaved(false);
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, title: value };
      if (!slugTouched) {
        next.slug = uniqueSlug(value, takenSlugs.filter((s) => s !== d.slug));
      }
      return next;
    });
  }

  const slugPreview = useMemo(() => draft?.slug ?? "", [draft?.slug]);

  async function persist(body: ProjectDraft) {
    if (rowId) return updateProject(rowId, body);
    return createProject(body);
  }

  async function save(publishState?: boolean) {
    if (!draft) return;
    const body: ProjectDraft = {
      ...draft,
      title: draft.title.trim(),
      slug: slugify(draft.slug) || uniqueSlug(draft.title, takenSlugs.filter((s) => s !== draft.slug)),
      published: publishState ?? draft.published,
    };
    if (!body.title) {
      setError("A title is required.");
      return;
    }

    setSaving(true);
    setError(null);
    const result = await persist(body);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    if (result.data) {
      setRowId(result.data.id);
      setDraft((d) =>
        d ? { ...d, published: body.published, slug: body.slug } : d
      );
      if (!rowId) navigate(`../${result.data.id}`, { replace: true });
    }
  }

  async function ensureRow(): Promise<string | null> {
    if (rowId) return rowId;
    if (!draft) return null;
    const body: ProjectDraft = {
      ...draft,
      title: draft.title.trim() || catalog?.title || "Untitled project",
      slug: slugify(draft.slug) || catalog?.slug || uniqueSlug(draft.title, takenSlugs),
    };
    setSaving(true);
    setError(null);
    const result = await createProject(body);
    setSaving(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Could not create the project row.");
      return null;
    }
    setRowId(result.data.id);
    setDraft((d) => (d ? { ...d, slug: result.data!.slug, title: result.data!.title } : d));
    navigate(`../${result.data.id}`, { replace: true });
    return result.data.id;
  }

  async function hideFromPublic() {
    if (!draft) return;
    const ok = window.confirm(
      `Hide “${draft.title}” from the public site?\n\nThe static fallback will not return until you Restore.`
    );
    if (!ok) return;
    const { error: err } = await setProjectVisible(kind, draft.slug, false);
    if (err) return setError(err);
    setHidden(true);
  }

  async function restorePublic() {
    if (!draft) return;
    const { error: err } = await setProjectVisible(kind, draft.slug, true);
    if (err) return setError(err);
    setHidden(false);
  }

  async function remove() {
    if (!rowId || !draft || hasStatic) return;
    const ok = window.confirm(
      `Delete “${draft.title}”?\n\nIts photographs are removed from the database too. This cannot be undone.`
    );
    if (!ok) return;
    const photos = await listProjectImages(rowId);
    const paths = (photos.data ?? []).flatMap((row) =>
      managedAssetPaths(row.storage_path, row.thumbnail_path)
    );
    const { error: err } = await deleteProject(rowId);
    if (err) return setError(err);
    await deleteStoredObjects(paths);
    navigate("..");
  }

  if (error && !draft) {
    return (
      <>
        <PageHeader title="Project" />
        <ErrorNote>{error}</ErrorNote>
        <div className="mt-4">
          <Button onClick={() => navigate("..")}>Back to list</Button>
        </div>
      </>
    );
  }

  if (!draft) {
    return (
      <>
        <PageHeader title="Project" />
        <p className="text-sm text-neutral-500">Loading…</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={isNew ? "New project" : draft.title || "Untitled project"}
        description={
          isNew
            ? "Saved as a draft until you publish it."
            : hidden
              ? "Hidden from the public site."
              : draft.published
                ? "Live on the public site."
                : hasStatic && !rowId
                  ? "Static fallback — live until hidden or replaced."
                  : "Draft — visitors still see the static fallback if one exists."
        }
        actions={
          <div className="flex gap-2">
            <ViewOnSite
              href={
                kind === "flycam" ? "/#flycam" : kind === "corporate" ? "/#business" : "/#work"
              }
            />
            <Button onClick={() => navigate("..")}>Back</Button>
            {hasStatic ? (
              hidden ? (
                <Button onClick={() => void restorePublic()}>Restore</Button>
              ) : (
                <Button onClick={() => void hideFromPublic()}>Hide from public</Button>
              )
            ) : rowId ? (
              <Button variant="danger" onClick={() => void remove()}>
                Delete
              </Button>
            ) : null}
          </div>
        }
      />

      {error && <div className="mb-5"><ErrorNote>{error}</ErrorNote></div>}

      {!isNew && (
        <div className="mb-12 space-y-10">
          {currentPhotos.length > 0 && (
            <CurrentPhotographs
              photos={currentPhotos}
              inactive={fallbackInactive || hidden}
              onUpload={() => {
                void (async () => {
                  const ensured = await ensureRow();
                  if (!ensured) return;
                  document.getElementById("managed-photographs")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                  imagesRef.current?.openFilePicker();
                })();
              }}
            />
          )}
          {rowId ? (
            <ImageManager
              ref={imagesRef}
              projectId={rowId}
              slug={draft.slug}
              kind={kind}
              corporateCategory={draft.corporate_category}
              staticSlots={currentPhotos}
              coverImageId={draft.cover_image_id}
              onCoverChange={(coverId) => patch("cover_image_id", coverId)}
              onCountChange={setManagedCount}
            />
          ) : (
            <section id="managed-photographs" className="max-w-4xl space-y-3">
              <h2 className="text-xl font-medium text-neutral-100">Managed photographs</h2>
              <p className="text-sm text-neutral-500">
                Saving or starting uploads creates the Supabase project row. Hide from public
                does not need a row — it only writes a visibility override.
              </p>
              <Button onClick={() => void ensureRow()}>Start managing photographs</Button>
            </section>
          )}
        </div>
      )}

      {!isNew && (
        <h2 className="mb-6 max-w-2xl text-xl font-medium text-neutral-100">
          Project details
        </h2>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="max-w-2xl space-y-6"
      >
        <Field label="Title">
          <TextInput value={draft.title} onChange={onTitleChange} required />
        </Field>

        <Field
          label="Slug"
          hint={`Used in the URL. Currently /${slugPreview || "…"}`}
        >
          <TextInput
            value={draft.slug}
            onChange={(v) => {
              setSlugTouched(true);
              patch("slug", v);
            }}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Display number"
            hint="The label shown on the site, e.g. 01. Independent of sort order."
          >
            <TextInput
              value={draft.display_number ?? ""}
              onChange={(v) => patch("display_number", nullify(v))}
              placeholder="01"
            />
          </Field>

          <Field label="Sort order" hint="Position in the list. Does not change the label.">
            <TextInput
              value={String(draft.sort_order)}
              onChange={(v) => patch("sort_order", Number(v.replace(/[^0-9-]/g, "")) || 0)}
            />
          </Field>
        </div>

        <Field label="Subtitle">
          <TextInput
            value={draft.subtitle ?? ""}
            onChange={(v) => patch("subtitle", nullify(v))}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Category">
            <TextInput
              value={draft.category ?? ""}
              onChange={(v) => patch("category", nullify(v))}
            />
          </Field>
          <Field label="Year" hint="Free text, so ranges like 2025–2026 work.">
            <TextInput value={draft.year ?? ""} onChange={(v) => patch("year", nullify(v))} />
          </Field>
        </div>

        <Field label="Location">
          <TextInput
            value={draft.location ?? ""}
            onChange={(v) => patch("location", nullify(v))}
          />
        </Field>

        <Field label="Description">
          <TextArea
            value={draft.description ?? ""}
            onChange={(v) => patch("description", nullify(v))}
          />
        </Field>

        {kind === "flycam" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Coordinates" hint="Shown as a GPS readout on the plate.">
              <TextInput
                value={draft.coordinates ?? ""}
                onChange={(v) => patch("coordinates", nullify(v))}
                placeholder="20.9101° N, 107.1839° E"
              />
            </Field>
            <Field label="Altitude">
              <TextInput
                value={draft.altitude ?? ""}
                onChange={(v) => patch("altitude", nullify(v))}
                placeholder="120m"
              />
            </Field>
          </div>
        )}

        {kind === "corporate" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Corporate category">
              <Select<CorporateCategory>
                value={draft.corporate_category ?? "headshot"}
                onChange={(v) => patch("corporate_category", v)}
                options={CORPORATE_CATEGORIES.map((c) => ({
                  value: c,
                  label: c[0].toUpperCase() + c.slice(1),
                }))}
              />
            </Field>
            <Field label="Client">
              <TextInput
                value={draft.client ?? ""}
                onChange={(v) => patch("client", nullify(v))}
              />
            </Field>
          </div>
        )}

        <div className="border-t border-neutral-800 pt-6">
          <Toggle
            checked={draft.published}
            onChange={(v) => patch("published", v)}
            label="Published"
            hint={
              hasStatic
                ? "Publishing a managed set replaces the static fallback. Unpublishing restores the fallback unless the project is Hidden."
                : "Unpublished projects are invisible to visitors — enforced by the database, not just this screen."
            }
          />
        </div>

        <div className="flex items-center gap-3 border-t border-neutral-800 pt-6">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : rowId ? "Save changes" : "Save project"}
          </Button>
          {rowId && (
            <Button
              disabled={saving}
              onClick={() => void save(!draft.published)}
            >
              {draft.published ? "Unpublish" : "Publish"}
            </Button>
          )}
          {saved && <span className="text-sm text-emerald-400">Saved.</span>}
        </div>

      </form>
    </>
  );
}
