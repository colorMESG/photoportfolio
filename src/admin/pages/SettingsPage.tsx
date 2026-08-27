import { useEffect, useState, type ReactNode } from "react";
import ReplaceablePhotograph from "../components/ReplaceablePhotograph";
import { Button, ErrorNote, Field, TextArea, TextInput, Toggle } from "../components/Form";
import { PageHeader, ViewOnSite } from "../components/PageHeader";
import {
  blankContentImage,
  settingsDraftFrom,
  staticSiteCopy,
  type ContentImageDraft,
  type SettingsDraft,
} from "../../lib/content/siteCopy";
import {
  getSiteSettings,
  publishSiteSettings,
  saveSiteSettingsDraft,
} from "../../lib/db/siteContent";
import { companionThumbPath } from "../../lib/optimizeImage";
import { deleteStoredObjects } from "../../lib/storage";

const emptyDraft = (): SettingsDraft => settingsDraftFrom(staticSiteCopy(), null);

function imageFromPath(path: string): ContentImageDraft {
  return {
    ...blankContentImage(),
    image_path: path || null,
    image_thumb_path: companionThumbPath(path || null),
  };
}

export default function SettingsPage() {
  const [draft, setDraft] = useState<SettingsDraft>(emptyDraft);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [orphans, setOrphans] = useState<string[]>([]);

  async function reload() {
    const result = await getSiteSettings();
    if (result.error) {
      setError(result.error);
      return;
    }
    const copy = staticSiteCopy();
    setDraft(settingsDraftFrom(copy, result.data));
    setPublishedAt(result.data?.published_at ?? null);
    setHasDraft(Boolean(result.data?.draft));
  }

  useEffect(() => {
    void reload();
  }, []);

  function patch<K extends keyof SettingsDraft>(
    key: K,
    value: SettingsDraft[K],
    orphanPaths?: string | string[]
  ) {
    setStatus(null);
    setDraft((current) => ({ ...current, [key]: value }));
    if (orphanPaths) {
      const list = Array.isArray(orphanPaths) ? orphanPaths : [orphanPaths];
      if (list.length) setOrphans((current) => [...current, ...list]);
    }
  }

  async function persist(mode: "draft" | "publish") {
    setSaving(mode);
    setError(null);
    const result =
      mode === "publish" ? await publishSiteSettings(draft) : await saveSiteSettingsDraft(draft);
    setSaving(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStatus(
      mode === "publish"
        ? "Published. Refresh the public site to see it."
        : "Draft saved. The public site is unchanged."
    );
    if (orphans.length) {
      await deleteStoredObjects(orphans);
      setOrphans([]);
    }
    await reload();
  }

  return (
    <>
      <PageHeader
        title="Site Settings"
        description="Brand, contact, SEO and indexing. Values load from the current website; empty database fields keep the static fallback."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ViewOnSite href="/" />
            {status && <span className="text-sm text-emerald-400">{status}</span>}
            <Button disabled={saving !== null} onClick={() => void persist("draft")}>
              {saving === "draft" ? "Saving…" : "Save Draft"}
            </Button>
            <Button variant="primary" disabled={saving !== null} onClick={() => void persist("publish")}>
              {saving === "publish" ? "Publishing…" : "Publish"}
            </Button>
          </div>
        }
      />

      {hasDraft && (
        <p className="mb-6 rounded-md border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          A settings draft is stored. Publish to put it on the public site.
          {publishedAt ? ` Last published ${new Date(publishedAt).toLocaleString()}.` : ""}
        </p>
      )}

      {error && (
        <div className="mb-6">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <div className="max-w-3xl space-y-10">
        <Section title="Identity">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Brand name">
              <TextInput value={draft.brand_name} onChange={(v) => patch("brand_name", v)} required />
            </Field>
            <Field label="Tagline">
              <TextInput value={draft.subtitle} onChange={(v) => patch("subtitle", v)} />
            </Field>
            <Field label="Year">
              <TextInput value={draft.year} onChange={(v) => patch("year", v)} />
            </Field>
          </div>
        </Section>

        <Section title="Contact">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Email">
              <TextInput value={draft.email} onChange={(v) => patch("email", v)} />
            </Field>
            <Field label="Phone">
              <TextInput value={draft.phone} onChange={(v) => patch("phone", v)} />
            </Field>
            <Field label="Phone link" hint="The tel: target, which can differ from the displayed number.">
              <TextInput value={draft.phone_href} onChange={(v) => patch("phone_href", v)} />
            </Field>
            <Field label="Location">
              <TextInput value={draft.location} onChange={(v) => patch("location", v)} />
            </Field>
            <Field label="Instagram handle">
              <TextInput value={draft.instagram_handle} onChange={(v) => patch("instagram_handle", v)} />
            </Field>
            <Field label="Instagram URL">
              <TextInput value={draft.instagram_url} onChange={(v) => patch("instagram_url", v)} />
            </Field>
          </div>
        </Section>

        <Section title="SEO">
          <Field label="SEO title">
            <TextInput value={draft.seo_title} onChange={(v) => patch("seo_title", v)} />
          </Field>
          <Field label="SEO description">
            <TextArea
              value={draft.seo_description}
              onChange={(v) => patch("seo_description", v)}
              rows={4}
            />
          </Field>
          <Toggle
            checked={draft.index_public}
            onChange={(v) => patch("index_public", v)}
            label="Allow search indexing"
            hint="When off, the public page sends noindex. Default matches the current Figma Make robots setting."
          />
          <ReplaceablePhotograph
            title="Open Graph image"
            slot="og"
            staticSrc=""
            staticAlt="Open Graph"
            image={imageFromPath(draft.og_image_path)}
            onChange={(image, orphans) => patch("og_image_path", image.image_path ?? "", orphans)}
          />
          <ReplaceablePhotograph
            title="Favicon"
            slot="favicon"
            staticSrc=""
            staticAlt="Favicon"
            image={imageFromPath(draft.favicon_path)}
            onChange={(image, orphans) =>
              patch("favicon_path", image.image_thumb_path || image.image_path || "", orphans)
            }
          />
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-5 border-t border-neutral-800 pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-medium tracking-wide text-neutral-300 uppercase">{title}</h2>
      {children}
    </section>
  );
}
