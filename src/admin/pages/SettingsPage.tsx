import { useEffect, useState, type ReactNode } from "react";
import CurrentImagePreview from "../components/CurrentImagePreview";
import { Button, ErrorNote, Field, TextArea, TextInput } from "../components/Form";
import { PageHeader } from "../components/PageHeader";
import {
  fetchManagedContent,
  resolveSiteCopy,
  settingsDraftFrom,
  staticSiteCopy,
  type SettingsDraft,
} from "../../lib/content/siteCopy";
import { saveSiteSettings } from "../../lib/db/siteContent";
import { imageUrl } from "../../lib/images";

const emptyDraft = (): SettingsDraft => settingsDraftFrom(staticSiteCopy(), null);

export default function SettingsPage() {
  const [draft, setDraft] = useState<SettingsDraft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const managed = await fetchManagedContent();
      if (!alive) return;
      const copy = resolveSiteCopy(managed);
      setDraft(settingsDraftFrom(copy, managed?.settings ?? null));
    })();
    return () => {
      alive = false;
    };
  }, []);

  function patch<K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    const result = await saveSiteSettings(draft);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    if (result.data) {
      setDraft(settingsDraftFrom(resolveSiteCopy({ settings: result.data, blocks: {} }), result.data));
    }
  }

  const ogSrc = draft.og_image_path.trim() ? imageUrl(draft.og_image_path.trim()) : "";

  return (
    <>
      <PageHeader
        title="Site Settings"
        description="Brand, contact and SEO. Values load from the current website; empty database fields keep that static fallback."
        actions={
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-emerald-400">Saved.</span>}
            <Button variant="primary" disabled={saving} onClick={() => void onSave()}>
              {saving ? "Saving…" : "Save settings"}
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
        <Section title="Identity">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Brand name">
              <TextInput value={draft.brand_name} onChange={(v) => patch("brand_name", v)} required />
            </Field>
            <Field label="Subtitle">
              <TextInput value={draft.subtitle} onChange={(v) => patch("subtitle", v)} />
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
          <Field
            label="Open Graph image path"
            hint="A path inside the portfolio bucket. Leave empty to keep the current fallback."
          >
            <TextInput value={draft.og_image_path} onChange={(v) => patch("og_image_path", v)} />
          </Field>
          {ogSrc ? (
            <CurrentImagePreview title="Open Graph image" src={ogSrc} alt="Open Graph" managed />
          ) : (
            <p className="text-xs text-neutral-500">No Open Graph image is stored yet.</p>
          )}
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
