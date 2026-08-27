import { useCallback, useEffect, useState } from "react";
import { servicesContent } from "../../content/site";
import ReplaceablePhotograph from "../components/ReplaceablePhotograph";
import { Button, ErrorNote, Field, TextInput, Toggle } from "../components/Form";
import { PageHeader, ViewOnSite } from "../components/PageHeader";
import { blankContentImage, type ContentImageDraft } from "../../lib/content/siteCopy";
import {
  insertService,
  listServices,
  publishAllServices,
  updateService,
} from "../../lib/db/services";
import type { ServiceRow } from "../../lib/db/types";
import { deleteStoredObjects } from "../../lib/storage";

function imageDraft(row: ServiceRow, alt: string): ContentImageDraft {
  return {
    ...blankContentImage(alt),
    image_path: row.storage_path,
    image_thumb_path: row.thumbnail_path,
    original_filename: row.original_filename,
    source_width: row.source_width,
    source_height: row.source_height,
    source_bytes: row.source_bytes,
    web_bytes: row.web_bytes,
    thumbnail_bytes: row.thumbnail_bytes,
  };
}

export default function ServicesPage() {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [orphans, setOrphans] = useState<string[]>([]);

  const load = useCallback(async () => {
    const { data, error: err } = await listServices();
    if (err) {
      setError(err);
      return;
    }
    if (data && data.length > 0) {
      setRows(data);
      return;
    }
    const created: ServiceRow[] = [];
    for (let i = 0; i < servicesContent.items.length; i++) {
      const item = servicesContent.items[i];
      const result = await insertService({
        display_number: item.num,
        title: item.title,
        subtitle: item.subtitle,
        sort_order: i + 1,
        published: true,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) created.push(result.data);
    }
    setRows(created);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(
    id: string,
    next: Parameters<typeof updateService>[1],
    orphanPaths?: string | string[]
  ) {
    setStatus(null);
    const { data, error: err } = await updateService(id, next);
    if (err) {
      setError(err);
      return;
    }
    if (data) setRows((current) => current.map((row) => (row.id === id ? data : row)));
    const list = orphanPaths ? (Array.isArray(orphanPaths) ? orphanPaths : [orphanPaths]) : [];
    if (list.length) {
      setOrphans((current) => [...current, ...list]);
      await deleteStoredObjects(list);
    }
  }

  async function publish() {
    setPublishing(true);
    setError(null);
    const { error: err } = await publishAllServices();
    setPublishing(false);
    if (err) {
      setError(err);
      return;
    }
    setStatus("Published. Refresh the public site to see the services list.");
    await load();
    if (orphans.length) setOrphans([]);
  }

  return (
    <>
      <PageHeader
        title="Services"
        description="Titles, subtitles and preview photographs for the public services list. Empty preview keeps the static photograph."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ViewOnSite href="/#services" />
            {status && <span className="text-sm text-emerald-400">{status}</span>}
            <Button variant="primary" disabled={publishing} onClick={() => void publish()}>
              {publishing ? "Publishing…" : "Publish services"}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <div className="max-w-3xl space-y-10">
        {rows.map((row, index) => {
          const fallback = servicesContent.items[index];
          return (
            <section key={row.id} className="space-y-5 border-t border-neutral-800 pt-8 first:border-t-0 first:pt-0">
              <h2 className="text-sm font-medium tracking-wide text-neutral-300 uppercase">
                Service {row.display_number || String(index + 1).padStart(2, "0")}
              </h2>
              <div className="grid gap-6 sm:grid-cols-3">
                <Field label="Number">
                  <TextInput
                    value={row.display_number ?? ""}
                    onChange={(v) => void patch(row.id, { display_number: v })}
                  />
                </Field>
                <Field label="Title">
                  <TextInput value={row.title} onChange={(v) => void patch(row.id, { title: v })} />
                </Field>
                <Field label="Subtitle">
                  <TextInput
                    value={row.subtitle ?? ""}
                    onChange={(v) => void patch(row.id, { subtitle: v })}
                  />
                </Field>
              </div>
              <ReplaceablePhotograph
                title="Preview photograph"
                slot={`service/${row.id}`}
                viewHref="/#services"
                staticSrc={fallback?.previewSrc ?? ""}
                staticAlt={fallback?.title ?? row.title}
                image={imageDraft(row, fallback?.title ?? row.title)}
                onChange={(image, orphans) =>
                  void patch(
                    row.id,
                    {
                      storage_path: image.image_path,
                      thumbnail_path: image.image_thumb_path,
                      original_filename: image.original_filename,
                      source_width: image.source_width,
                      source_height: image.source_height,
                      source_bytes: image.source_bytes,
                      web_bytes: image.web_bytes,
                      thumbnail_bytes: image.thumbnail_bytes,
                    },
                    orphans
                  )
                }
              />
              <Toggle
                checked={row.published}
                onChange={(v) => void patch(row.id, { published: v })}
                label="Published"
                hint="Unpublished services are hidden from visitors."
              />
              {row.storage_path && (
                <p className="text-xs text-neutral-500">Stored at {row.storage_path}</p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
