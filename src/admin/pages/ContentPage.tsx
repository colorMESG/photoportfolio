import { useEffect, useState, type ReactNode } from "react";
import CurrentImagePreview from "../components/CurrentImagePreview";
import { Button, ErrorNote, Field, TextArea, TextInput } from "../components/Form";
import { PageHeader } from "../components/PageHeader";
import {
  contentDraftFromCopy,
  fetchManagedContent,
  hasManagedImage,
  resolveSiteCopy,
  staticSiteCopy,
  type ContentDraft,
} from "../../lib/content/siteCopy";
import { saveContentDraft } from "../../lib/db/siteContent";

function splitLines(value: string): string[] {
  return value.split("\n");
}

export default function ContentPage() {
  const [draft, setDraft] = useState<ContentDraft>(() => contentDraftFromCopy(staticSiteCopy()));
  const [heroSrc, setHeroSrc] = useState(staticSiteCopy().hero.image.src);
  const [heroAlt, setHeroAlt] = useState(staticSiteCopy().hero.image.alt);
  const [aboutSrc, setAboutSrc] = useState(staticSiteCopy().about.image.src);
  const [aboutAlt, setAboutAlt] = useState(staticSiteCopy().about.image.alt);
  const [contactSrc, setContactSrc] = useState(staticSiteCopy().contact.image.src);
  const [contactAlt, setContactAlt] = useState(staticSiteCopy().contact.image.alt);
  const [heroManaged, setHeroManaged] = useState(false);
  const [aboutManaged, setAboutManaged] = useState(false);
  const [contactManaged, setContactManaged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const managed = await fetchManagedContent();
      if (!alive) return;
      const copy = resolveSiteCopy(managed);
      setDraft(contentDraftFromCopy(copy));
      setHeroSrc(copy.hero.image.src);
      setHeroAlt(copy.hero.image.alt);
      setAboutSrc(copy.about.image.src);
      setAboutAlt(copy.about.image.alt);
      setContactSrc(copy.contact.image.src);
      setContactAlt(copy.contact.image.alt);
      setHeroManaged(hasManagedImage(managed?.blocks.hero));
      setAboutManaged(hasManagedImage(managed?.blocks.about));
      setContactManaged(hasManagedImage(managed?.blocks.contact));
    })();
    return () => {
      alive = false;
    };
  }, []);

  function patch<K extends keyof ContentDraft>(key: K, value: ContentDraft[K]) {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    const result = await saveContentDraft({
      ...draft,
      hero: {
        words: draft.hero.words.map((w) => w.trim()).filter(Boolean),
        meta: draft.hero.meta.map((m) => m.trim()).filter(Boolean),
        scrollLabel: draft.hero.scrollLabel.trim(),
      },
      marquee: draft.marquee.map((item) => item.trim()).filter(Boolean),
      statement: {
        lines: draft.statement.lines.map((line) => line.trim()).filter(Boolean),
        paragraph: draft.statement.paragraph.trim(),
      },
      about: {
        headings: draft.about.headings.map((h) => h.trim()).filter(Boolean),
        paragraphs: draft.about.paragraphs.map((p) => p.trim()).filter(Boolean),
        details: draft.about.details.map((d) => d.trim()).filter(Boolean),
      },
      contact: {
        words: draft.contact.words.map((w) => w.trim()).filter(Boolean),
        emailLabel: draft.contact.emailLabel.trim(),
        phoneLabel: draft.contact.phoneLabel.trim(),
        addressLabel: draft.contact.addressLabel.trim(),
      },
      footer: {
        tagline: draft.footer.tagline.trim(),
        backToTop: draft.footer.backToTop.trim(),
        copyright: draft.footer.copyright.trim(),
      },
      navigation: draft.navigation
        .map((link) => ({ label: link.label.trim(), href: link.href.trim() }))
        .filter((link) => link.label && link.href),
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <>
      <PageHeader
        title="About / Content"
        description="Page copy currently on the public site. Empty Supabase fields keep the static fallback — this form never starts blank."
        actions={
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-emerald-400">Saved.</span>}
            <Button variant="primary" disabled={saving} onClick={() => void onSave()}>
              {saving ? "Saving…" : "Save content"}
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
        <Section title="Hero">
          <CurrentImagePreview title="Hero photograph" src={heroSrc} alt={heroAlt} managed={heroManaged} />
          <Field label="Words" hint="One line per word. These are the oversized hero lines.">
            <TextArea
              value={draft.hero.words.join("\n")}
              onChange={(v) => patch("hero", { ...draft.hero, words: splitLines(v) })}
              rows={3}
            />
          </Field>
          <Field label="Meta" hint="One line per caption, shown at the bottom-right of the hero.">
            <TextArea
              value={draft.hero.meta.join("\n")}
              onChange={(v) => patch("hero", { ...draft.hero, meta: splitLines(v) })}
              rows={3}
            />
          </Field>
          <Field label="Scroll label">
            <TextInput
              value={draft.hero.scrollLabel}
              onChange={(v) => patch("hero", { ...draft.hero, scrollLabel: v })}
            />
          </Field>
        </Section>

        <Section title="Marquee">
          <Field label="Items" hint="One service term per line.">
            <TextArea
              value={draft.marquee.join("\n")}
              onChange={(v) => patch("marquee", splitLines(v))}
              rows={8}
            />
          </Field>
        </Section>

        <Section title="Statement">
          <Field label="Lines" hint="One line per stacked phrase.">
            <TextArea
              value={draft.statement.lines.join("\n")}
              onChange={(v) => patch("statement", { ...draft.statement, lines: splitLines(v) })}
              rows={7}
            />
          </Field>
          <Field label="Paragraph">
            <TextArea
              value={draft.statement.paragraph}
              onChange={(v) => patch("statement", { ...draft.statement, paragraph: v })}
              rows={4}
            />
          </Field>
        </Section>

        <Section title="About">
          <CurrentImagePreview title="About photograph" src={aboutSrc} alt={aboutAlt} managed={aboutManaged} />
          <Field label="Headings" hint="One line per heading. The second line is the stroked word.">
            <TextArea
              value={draft.about.headings.join("\n")}
              onChange={(v) => patch("about", { ...draft.about, headings: splitLines(v) })}
              rows={2}
            />
          </Field>
          <Field label="Paragraphs" hint="One paragraph per line.">
            <TextArea
              value={draft.about.paragraphs.join("\n")}
              onChange={(v) => patch("about", { ...draft.about, paragraphs: splitLines(v) })}
              rows={4}
            />
          </Field>
          <Field label="Details" hint="Email, phone and location lines under the about text.">
            <TextArea
              value={draft.about.details.join("\n")}
              onChange={(v) => patch("about", { ...draft.about, details: splitLines(v) })}
              rows={3}
            />
          </Field>
        </Section>

        <Section title="Contact">
          <CurrentImagePreview
            title="Contact photograph"
            src={contactSrc}
            alt={contactAlt}
            managed={contactManaged}
          />
          <Field label="Words" hint="One line per oversized contact word.">
            <TextArea
              value={draft.contact.words.join("\n")}
              onChange={(v) => patch("contact", { ...draft.contact, words: splitLines(v) })}
              rows={4}
            />
          </Field>
          <div className="grid gap-6 sm:grid-cols-3">
            <Field label="Email label">
              <TextInput
                value={draft.contact.emailLabel}
                onChange={(v) => patch("contact", { ...draft.contact, emailLabel: v })}
              />
            </Field>
            <Field label="Phone label">
              <TextInput
                value={draft.contact.phoneLabel}
                onChange={(v) => patch("contact", { ...draft.contact, phoneLabel: v })}
              />
            </Field>
            <Field label="Address label">
              <TextInput
                value={draft.contact.addressLabel}
                onChange={(v) => patch("contact", { ...draft.contact, addressLabel: v })}
              />
            </Field>
          </div>
          <p className="text-xs text-neutral-500">
            Email, phone and address values live under Site Settings. These labels only rename the
            rows on the contact section.
          </p>
        </Section>

        <Section title="Footer">
          <Field label="Tagline">
            <TextInput
              value={draft.footer.tagline}
              onChange={(v) => patch("footer", { ...draft.footer, tagline: v })}
            />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Back to top">
              <TextInput
                value={draft.footer.backToTop}
                onChange={(v) => patch("footer", { ...draft.footer, backToTop: v })}
              />
            </Field>
            <Field label="Copyright">
              <TextInput
                value={draft.footer.copyright}
                onChange={(v) => patch("footer", { ...draft.footer, copyright: v })}
              />
            </Field>
          </div>
        </Section>

        <Section title="Navigation">
          <div className="space-y-3">
            {draft.navigation.map((link, index) => (
              <div key={`${link.href}-${index}`} className="grid gap-3 sm:grid-cols-2">
                <Field label={`Label ${index + 1}`}>
                  <TextInput
                    value={link.label}
                    onChange={(v) => {
                      const navigation = draft.navigation.map((item, i) =>
                        i === index ? { ...item, label: v } : item
                      );
                      patch("navigation", navigation);
                    }}
                  />
                </Field>
                <Field label={`Href ${index + 1}`}>
                  <TextInput
                    value={link.href}
                    onChange={(v) => {
                      const navigation = draft.navigation.map((item, i) =>
                        i === index ? { ...item, href: v } : item
                      );
                      patch("navigation", navigation);
                    }}
                  />
                </Field>
              </div>
            ))}
          </div>
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
