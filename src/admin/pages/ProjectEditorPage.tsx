import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { staticProject } from "../../lib/content/staticCatalog";
import {
  createProject,
  deleteProject,
  emptyProject,
  getProject,
  listAllSlugs,
  nextSortOrder,
  updateProject,
} from "../../lib/db/projects";
import { listProjectImages } from "../../lib/db/images";
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
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new" || id === undefined;
  const navigate = useNavigate();

  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [takenSlugs, setTakenSlugs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const imagesRef = useRef<ImageManagerHandle>(null);
  const currentPhotos = draft ? staticProject(kind, draft.slug)?.images ?? [] : [];

  useEffect(() => {
    let alive = true;
    void (async () => {
      const slugs = await listAllSlugs(kind);
      if (!alive) return;
      setTakenSlugs(slugs);

      if (isNew) {
        const order = await nextSortOrder(kind);
        if (alive) setDraft(emptyProject(kind, order));
        return;
      }
      const { data, error: err } = await getProject(id!);
      if (!alive) return;
      if (err || !data) {
        setError(err ?? "That project no longer exists.");
        return;
      }
      setSlugTouched(true);
      const { id: _id, created_at: _c, updated_at: _u, ...rest } = data;
      setDraft(rest);
    })();
    return () => {
      alive = false;
    };
  }, [id, isNew, kind]);

  const patch = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) => {
    setSaved(false);
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  };

  // While the slug has not been edited by hand, keep it in step with the title.
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

  async function save(publishState?: boolean) {
    if (!draft) return;
    const body: ProjectDraft = {
      ...draft,
      title: draft.title.trim(),
      slug: slugify(draft.slug) || uniqueSlug(draft.title, takenSlugs),
      published: publishState ?? draft.published,
    };
    if (!body.title) {
      setError("A title is required.");
      return;
    }

    setSaving(true);
    setError(null);
    const result = isNew
      ? await createProject(body)
      : await updateProject(id!, body);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    if (isNew && result.data) {
      navigate(`../${result.data.id}`, { replace: true });
    } else {
      setDraft((d) => (d ? { ...d, published: body.published, slug: body.slug } : d));
    }
  }

  async function remove() {
    if (isNew || !draft) return;
    const ok = window.confirm(
      `Delete “${draft.title}”?\n\nIts photographs are removed from the database too. This cannot be undone.`
    );
    if (!ok) return;
    const photos = await listProjectImages(id!);
    const paths = (photos.data ?? []).flatMap((row) =>
      managedAssetPaths(row.storage_path, row.thumbnail_path)
    );
    const { error: err } = await deleteProject(id!);
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
            : draft.published
              ? "Live on the public site."
              : "Draft — not visible to visitors."
        }
        actions={
          <div className="flex gap-2">
            <ViewOnSite
              href={
                kind === "flycam" ? "/#flycam" : kind === "corporate" ? "/#business" : "/#work"
              }
            />
            <Button onClick={() => navigate("..")}>Back</Button>
            {!isNew && (
              <Button variant="danger" onClick={() => void remove()}>
                Delete
              </Button>
            )}
          </div>
        }
      />

      {error && <div className="mb-5"><ErrorNote>{error}</ErrorNote></div>}

      {!isNew && id && (
        <div className="mb-12 space-y-10">
          <CurrentPhotographs
            photos={currentPhotos}
            onUpload={() => {
              document.getElementById("managed-photographs")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
              imagesRef.current?.openFilePicker();
            }}
          />
          <ImageManager
            ref={imagesRef}
            projectId={id}
            slug={draft.slug}
            kind={kind}
            coverImageId={draft.cover_image_id}
            onCoverChange={(coverId) => patch("cover_image_id", coverId)}
          />
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
            hint="Unpublished projects are invisible to visitors — enforced by the database, not just this screen."
          />
        </div>

        <div className="flex items-center gap-3 border-t border-neutral-800 pt-6">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : isNew ? "Create project" : "Save changes"}
          </Button>
          {!isNew && (
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
