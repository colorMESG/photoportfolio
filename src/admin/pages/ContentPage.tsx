import { useEffect, useState, type ReactNode } from "react";
import { Button, ErrorNote, Field, TextArea, TextInput } from "../components/Form";
import { PageHeader, ViewOnSite } from "../components/PageHeader";
import ReplaceablePhotograph from "../components/ReplaceablePhotograph";
import {
  contentDraftFromCopy,
  resolveSiteCopy,
  staticSiteCopy,
  type ContentDraft,
} from "../../lib/content/siteCopy";
import {
  blocksHaveUnpublishedDraft,
  getContentBlockRows,
  publishContentDraft,
  saveContentDraft,
} from "../../lib/db/siteContent";
import { deleteStoredObjects } from "../../lib/storage";

function splitLines(value: string): string[] {
  return value.split("\n");
}

function pair(lines: string[], fallback: [string, string]): [string, string] {
  const next = lines.map((line) => line.trim()).filter(Boolean);
  return [next[0] || fallback[0], next[1] || fallback[1]];
}

const staticCopy = staticSiteCopy();

export default function ContentPage() {
  const [draft, setDraft] = useState<ContentDraft>(() => contentDraftFromCopy(staticCopy));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [unpublished, setUnpublished] = useState(false);
  const [orphans, setOrphans] = useState<string[]>([]);

  async function reload() {
    const rows = await getContentBlockRows();
    if (rows.error) {
      setError(rows.error);
      return;
    }
    const blocks: Record<string, Record<string, unknown>> = {};
    for (const row of rows.data ?? []) blocks[row.key] = row.data ?? {};
    const copy = resolveSiteCopy({ settings: null, blocks, services: [], gallery: [] });
    setDraft(contentDraftFromCopy(copy, { settings: null, blocks, services: [], gallery: [] }));
    setUnpublished(blocksHaveUnpublishedDraft(rows.data ?? []));
  }

  useEffect(() => {
    void reload();
  }, []);

  function patch<K extends keyof ContentDraft>(
    key: K,
    value: ContentDraft[K],
    orphanPaths?: string | string[]
  ) {
    setStatus(null);
    setDraft((current) => ({ ...current, [key]: value }));
    if (orphanPaths) {
      const list = Array.isArray(orphanPaths) ? orphanPaths : [orphanPaths];
      if (list.length) setOrphans((current) => [...current, ...list]);
    }
  }

  function cleaned(): ContentDraft {
    return {
      ...draft,
      hero: {
        words: draft.hero.words.map((w) => w.trim()).filter(Boolean),
        meta: draft.hero.meta.map((m) => m.trim()).filter(Boolean),
        scrollLabel: draft.hero.scrollLabel.trim(),
        image: { ...draft.hero.image, image_alt: draft.hero.image.image_alt.trim() },
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
        image: { ...draft.about.image, image_alt: draft.about.image.image_alt.trim() },
      },
      contact: {
        words: draft.contact.words.map((w) => w.trim()).filter(Boolean),
        emailLabel: draft.contact.emailLabel.trim(),
        phoneLabel: draft.contact.phoneLabel.trim(),
        addressLabel: draft.contact.addressLabel.trim(),
        image: { ...draft.contact.image, image_alt: draft.contact.image.image_alt.trim() },
      },
      footer: {
        tagline: draft.footer.tagline.trim(),
        backToTop: draft.footer.backToTop.trim(),
        copyright: draft.footer.copyright.trim(),
      },
      navigation: draft.navigation
        .map((link) => ({ label: link.label.trim(), href: link.href.trim() }))
        .filter((link) => link.label && link.href),
      headings: {
        selectedWorks: {
          lines: pair(draft.headings.selectedWorks.lines, staticCopy.headings.selectedWorks.lines),
        },
        gallery: { lines: pair(draft.headings.gallery.lines, staticCopy.headings.gallery.lines) },
        services: {
          eyebrow: draft.headings.services.eyebrow.trim(),
          heading: draft.headings.services.heading.trim(),
        },
        flycam: {
          eyebrow: draft.headings.flycam.eyebrow.trim(),
          lines: pair(draft.headings.flycam.lines, staticCopy.headings.flycam.lines),
          description: draft.headings.flycam.description.trim(),
        },
        corporate: {
          eyebrow: draft.headings.corporate.eyebrow.trim(),
          lines: pair(draft.headings.corporate.lines, staticCopy.headings.corporate.lines),
          description: draft.headings.corporate.description.trim(),
          headshotsLabel: draft.headings.corporate.headshotsLabel.trim(),
          eventsLabel: draft.headings.corporate.eventsLabel.trim(),
          teamsLabel: draft.headings.corporate.teamsLabel.trim(),
        },
      },
      ghost: {
        locationSeries: draft.ghost.locationSeries.trim(),
        events: draft.ghost.events.trim(),
        flycam: draft.ghost.flycam.trim(),
        collage: draft.ghost.collage.trim(),
        stats: draft.ghost.stats.trim(),
      },
      flycamCapabilities: draft.flycamCapabilities.map((item) => ({
        label: item.label.trim(),
        val: item.val.trim(),
      })),
      stats: {
        ...draft.stats,
        retouchLabel: draft.stats.retouchLabel.trim(),
        beforeLabel: draft.stats.beforeLabel.trim(),
        afterLabel: draft.stats.afterLabel.trim(),
        dragHint: draft.stats.dragHint.trim(),
        note: draft.stats.note.trim(),
      },
      filmStrip: {
        heading: draft.filmStrip.heading.trim(),
        labels: draft.filmStrip.labels.map((label) => label.trim()),
        frames: draft.filmStrip.frames.map((frame) => ({
          ...frame,
          n: frame.n.trim(),
          loc: frame.loc.trim(),
        })),
      },
      collage: {
        ...draft.collage,
        word: draft.collage.word.trim(),
        meta: draft.collage.meta.map((item) => item.trim()).filter(Boolean),
      },
      aerialFrames: draft.aerialFrames.map((frame) => ({
        ...frame,
        loc: frame.loc.trim(),
        region: frame.region.trim(),
        altitude: frame.altitude.trim(),
      })),
      rosieNumerals: draft.rosieNumerals.map((item) => ({
        numeral: item.numeral.trim(),
        label: item.label.trim(),
      })),
      ui: { lightboxClose: draft.ui.lightboxClose.trim() },
    };
  }

  async function persist(mode: "draft" | "publish") {
    setSaving(mode);
    setError(null);
    const payload = cleaned();
    const result = mode === "publish" ? await publishContentDraft(payload) : await saveContentDraft(payload);
    setSaving(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStatus(mode === "publish" ? "Published. Refresh the public site to see it." : "Draft saved. The public site is unchanged.");
    setUnpublished(mode !== "publish");
    if (orphans.length) {
      await deleteStoredObjects(orphans);
      setOrphans([]);
    }
    await reload();
  }

  return (
    <>
      <PageHeader
        title="About / Content"
        description="Current public copy loads into this form. Save Draft keeps it private. Publish is what the website reads from Supabase."
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

      {unpublished && (
        <p className="mb-6 rounded-md border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          Unpublished draft. The public site still shows the last Publish.
        </p>
      )}

      {error && (
        <div className="mb-6">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <div className="max-w-3xl space-y-10">
        <Section title="Hero" href="/#hero">
          <ReplaceablePhotograph
            title="Hero photograph"
            slot="hero"
            viewHref="/"
            staticSrc={staticCopy.hero.image.src}
            staticAlt={staticCopy.hero.image.alt}
            image={draft.hero.image}
            onChange={(image, orphan) => patch("hero", { ...draft.hero, image }, orphan)}
          />
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

        <Section title="Services heading" href="/#services">
          <Field label="Eyebrow">
            <TextInput
              value={draft.headings.services.eyebrow}
              onChange={(v) =>
                patch("headings", { ...draft.headings, services: { ...draft.headings.services, eyebrow: v } })
              }
            />
          </Field>
          <Field label="Heading">
            <TextInput
              value={draft.headings.services.heading}
              onChange={(v) =>
                patch("headings", { ...draft.headings, services: { ...draft.headings.services, heading: v } })
              }
            />
          </Field>
          <p className="text-xs text-neutral-500">
            Service titles, subtitles and preview photographs are edited under Services.
          </p>
        </Section>

        <Section title="About" href="/#about">
          <ReplaceablePhotograph
            title="About photograph"
            slot="about"
            viewHref="/#about"
            staticSrc={staticCopy.about.image.src}
            staticAlt={staticCopy.about.image.alt}
            image={draft.about.image}
            onChange={(image, orphan) => patch("about", { ...draft.about, image }, orphan)}
          />
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

        <Section title="Contact" href="/#contact">
          <ReplaceablePhotograph
            title="Contact photograph"
            slot="contact"
            viewHref="/#contact"
            staticSrc={staticCopy.contact.image.src}
            staticAlt={staticCopy.contact.image.alt}
            image={draft.contact.image}
            onChange={(image, orphan) => patch("contact", { ...draft.contact, image }, orphan)}
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

        <Section title="Section headings" href="/#work">
          <Field label="Selected works" hint="Two lines.">
            <TextArea
              value={draft.headings.selectedWorks.lines.join("\n")}
              onChange={(v) =>
                patch("headings", {
                  ...draft.headings,
                  selectedWorks: { lines: pair(splitLines(v), staticCopy.headings.selectedWorks.lines) },
                })
              }
              rows={2}
            />
          </Field>
          <Field label="Personal gallery" hint="Two lines.">
            <TextArea
              value={draft.headings.gallery.lines.join("\n")}
              onChange={(v) =>
                patch("headings", {
                  ...draft.headings,
                  gallery: { lines: pair(splitLines(v), staticCopy.headings.gallery.lines) },
                })
              }
              rows={2}
            />
          </Field>
          <Field label="Flycam eyebrow">
            <TextInput
              value={draft.headings.flycam.eyebrow}
              onChange={(v) =>
                patch("headings", { ...draft.headings, flycam: { ...draft.headings.flycam, eyebrow: v } })
              }
            />
          </Field>
          <Field label="Flycam heading" hint="Two lines.">
            <TextArea
              value={draft.headings.flycam.lines.join("\n")}
              onChange={(v) =>
                patch("headings", {
                  ...draft.headings,
                  flycam: {
                    ...draft.headings.flycam,
                    lines: pair(splitLines(v), staticCopy.headings.flycam.lines),
                  },
                })
              }
              rows={2}
            />
          </Field>
          <Field label="Flycam description">
            <TextArea
              value={draft.headings.flycam.description}
              onChange={(v) =>
                patch("headings", {
                  ...draft.headings,
                  flycam: { ...draft.headings.flycam, description: v },
                })
              }
              rows={3}
            />
          </Field>
          <Field label="Corporate eyebrow">
            <TextInput
              value={draft.headings.corporate.eyebrow}
              onChange={(v) =>
                patch("headings", {
                  ...draft.headings,
                  corporate: { ...draft.headings.corporate, eyebrow: v },
                })
              }
            />
          </Field>
          <Field label="Corporate heading" hint="Two lines.">
            <TextArea
              value={draft.headings.corporate.lines.join("\n")}
              onChange={(v) =>
                patch("headings", {
                  ...draft.headings,
                  corporate: {
                    ...draft.headings.corporate,
                    lines: pair(splitLines(v), staticCopy.headings.corporate.lines),
                  },
                })
              }
              rows={2}
            />
          </Field>
          <Field label="Corporate description">
            <TextArea
              value={draft.headings.corporate.description}
              onChange={(v) =>
                patch("headings", {
                  ...draft.headings,
                  corporate: { ...draft.headings.corporate, description: v },
                })
              }
              rows={3}
            />
          </Field>
          <div className="grid gap-6 sm:grid-cols-3">
            <Field label="Headshots label">
              <TextInput
                value={draft.headings.corporate.headshotsLabel}
                onChange={(v) =>
                  patch("headings", {
                    ...draft.headings,
                    corporate: { ...draft.headings.corporate, headshotsLabel: v },
                  })
                }
              />
            </Field>
            <Field label="Events label">
              <TextInput
                value={draft.headings.corporate.eventsLabel}
                onChange={(v) =>
                  patch("headings", {
                    ...draft.headings,
                    corporate: { ...draft.headings.corporate, eventsLabel: v },
                  })
                }
              />
            </Field>
            <Field label="Teams label">
              <TextInput
                value={draft.headings.corporate.teamsLabel}
                onChange={(v) =>
                  patch("headings", {
                    ...draft.headings,
                    corporate: { ...draft.headings.corporate, teamsLabel: v },
                  })
                }
              />
            </Field>
          </div>
        </Section>

        <Section title="Ghost words">
          <div className="grid gap-6 sm:grid-cols-2">
            {(
              [
                ["locationSeries", "Location series"],
                ["events", "Events"],
                ["flycam", "Flycam overlay"],
                ["collage", "Collage"],
                ["stats", "Stats"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <TextInput
                  value={draft.ghost[key]}
                  onChange={(v) => patch("ghost", { ...draft.ghost, [key]: v })}
                />
              </Field>
            ))}
          </div>
        </Section>

        <Section title="Flycam capabilities" href="/#flycam">
          {draft.flycamCapabilities.map((item, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-2">
              <Field label={`Label ${index + 1}`}>
                <TextInput
                  value={item.label}
                  onChange={(v) => {
                    const flycamCapabilities = draft.flycamCapabilities.map((row, i) =>
                      i === index ? { ...row, label: v } : row
                    );
                    patch("flycamCapabilities", flycamCapabilities);
                  }}
                />
              </Field>
              <Field label={`Value ${index + 1}`}>
                <TextInput
                  value={item.val}
                  onChange={(v) => {
                    const flycamCapabilities = draft.flycamCapabilities.map((row, i) =>
                      i === index ? { ...row, val: v } : row
                    );
                    patch("flycamCapabilities", flycamCapabilities);
                  }}
                />
              </Field>
            </div>
          ))}
        </Section>

        <Section title="Stats / retouch">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Retouch label">
              <TextInput
                value={draft.stats.retouchLabel}
                onChange={(v) => patch("stats", { ...draft.stats, retouchLabel: v })}
              />
            </Field>
            <Field label="Before label">
              <TextInput
                value={draft.stats.beforeLabel}
                onChange={(v) => patch("stats", { ...draft.stats, beforeLabel: v })}
              />
            </Field>
            <Field label="After label">
              <TextInput
                value={draft.stats.afterLabel}
                onChange={(v) => patch("stats", { ...draft.stats, afterLabel: v })}
              />
            </Field>
            <Field label="Drag hint">
              <TextInput
                value={draft.stats.dragHint}
                onChange={(v) => patch("stats", { ...draft.stats, dragHint: v })}
              />
            </Field>
          </div>
          {draft.stats.items.map((item, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-3">
              <Field label="Target">
                <TextInput
                  value={String(item.target)}
                  onChange={(v) => {
                    const items = draft.stats.items.map((row, i) =>
                      i === index ? { ...row, target: Number(v.replace(/[^0-9.-]/g, "")) || 0 } : row
                    );
                    patch("stats", { ...draft.stats, items });
                  }}
                />
              </Field>
              <Field label="Suffix">
                <TextInput
                  value={item.suffix}
                  onChange={(v) => {
                    const items = draft.stats.items.map((row, i) =>
                      i === index ? { ...row, suffix: v } : row
                    );
                    patch("stats", { ...draft.stats, items });
                  }}
                />
              </Field>
              <Field label="Label">
                <TextInput
                  value={item.label}
                  onChange={(v) => {
                    const items = draft.stats.items.map((row, i) =>
                      i === index ? { ...row, label: v } : row
                    );
                    patch("stats", { ...draft.stats, items });
                  }}
                />
              </Field>
            </div>
          ))}
          <Field label="Note">
            <TextArea
              value={draft.stats.note}
              onChange={(v) => patch("stats", { ...draft.stats, note: v })}
              rows={3}
            />
          </Field>
        </Section>

        <Section title="35mm film strip">
          <Field label="Heading">
            <TextInput
              value={draft.filmStrip.heading}
              onChange={(v) => patch("filmStrip", { ...draft.filmStrip, heading: v })}
            />
          </Field>
          <Field label="Labels" hint="Two lines.">
            <TextArea
              value={draft.filmStrip.labels.join("\n")}
              onChange={(v) => patch("filmStrip", { ...draft.filmStrip, labels: splitLines(v) })}
              rows={2}
            />
          </Field>
          {draft.filmStrip.frames.map((frame, index) => (
            <div key={frame.n + index} className="space-y-3 border-t border-neutral-800 pt-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Frame">
                  <TextInput
                    value={frame.n}
                    onChange={(v) => {
                      const frames = draft.filmStrip.frames.map((row, i) =>
                        i === index ? { ...row, n: v } : row
                      );
                      patch("filmStrip", { ...draft.filmStrip, frames });
                    }}
                  />
                </Field>
                <Field label="Location">
                  <TextInput
                    value={frame.loc}
                    onChange={(v) => {
                      const frames = draft.filmStrip.frames.map((row, i) =>
                        i === index ? { ...row, loc: v } : row
                      );
                      patch("filmStrip", { ...draft.filmStrip, frames });
                    }}
                  />
                </Field>
              </div>
              <ReplaceablePhotograph
                title={`Frame ${frame.n}`}
                slot={`film/${index}`}
                staticSrc={staticCopy.filmStrip.frames[index]?.src ?? ""}
                staticAlt={staticCopy.filmStrip.frames[index]?.loc ?? frame.loc}
                image={frame.image}
                onChange={(image, orphan) => {
                  const frames = draft.filmStrip.frames.map((row, i) =>
                    i === index ? { ...row, image } : row
                  );
                  patch("filmStrip", { ...draft.filmStrip, frames }, orphan);
                }}
              />
            </div>
          ))}
        </Section>

        <Section title="Collage">
          <Field label="Word">
            <TextInput
              value={draft.collage.word}
              onChange={(v) => patch("collage", { ...draft.collage, word: v })}
            />
          </Field>
          <Field label="Meta" hint="One line per caption.">
            <TextArea
              value={draft.collage.meta.join("\n")}
              onChange={(v) => patch("collage", { ...draft.collage, meta: splitLines(v) })}
              rows={2}
            />
          </Field>
          <ReplaceablePhotograph
            title="Background"
            slot="collage/background"
            staticSrc={staticCopy.collage.background.src}
            staticAlt={staticCopy.collage.background.alt}
            image={draft.collage.background}
            onChange={(image, orphan) => patch("collage", { ...draft.collage, background: image }, orphan)}
          />
          {draft.collage.overlays.map((image, index) => (
            <ReplaceablePhotograph
              key={index}
              title={`Overlay ${index + 1}`}
              slot={`collage/overlay-${index}`}
              staticSrc={staticCopy.collage.overlays[index]?.src ?? ""}
              staticAlt={staticCopy.collage.overlays[index]?.alt ?? ""}
              image={image}
              onChange={(next, orphan) => {
                const overlays = draft.collage.overlays.map((row, i) => (i === index ? next : row));
                patch("collage", { ...draft.collage, overlays }, orphan);
              }}
            />
          ))}
        </Section>

        <Section title="Flycam portrait frames" href="/#flycam">
          {draft.aerialFrames.map((frame, index) => (
            <div key={index} className="space-y-3 border-t border-neutral-800 pt-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Location">
                  <TextInput
                    value={frame.loc}
                    onChange={(v) => {
                      const aerialFrames = draft.aerialFrames.map((row, i) =>
                        i === index ? { ...row, loc: v } : row
                      );
                      patch("aerialFrames", aerialFrames);
                    }}
                  />
                </Field>
                <Field label="Region">
                  <TextInput
                    value={frame.region}
                    onChange={(v) => {
                      const aerialFrames = draft.aerialFrames.map((row, i) =>
                        i === index ? { ...row, region: v } : row
                      );
                      patch("aerialFrames", aerialFrames);
                    }}
                  />
                </Field>
                <Field label="Altitude">
                  <TextInput
                    value={frame.altitude}
                    onChange={(v) => {
                      const aerialFrames = draft.aerialFrames.map((row, i) =>
                        i === index ? { ...row, altitude: v } : row
                      );
                      patch("aerialFrames", aerialFrames);
                    }}
                  />
                </Field>
              </div>
              <ReplaceablePhotograph
                title={frame.loc || `Frame ${index + 1}`}
                slot={`aerial/${index}`}
                staticSrc={staticCopy.aerialFrames[index]?.src ?? ""}
                staticAlt={staticCopy.aerialFrames[index]?.loc ?? frame.loc}
                image={frame.image}
                onChange={(image, orphan) => {
                  const aerialFrames = draft.aerialFrames.map((row, i) =>
                    i === index ? { ...row, image } : row
                  );
                  patch("aerialFrames", aerialFrames, orphan);
                }}
              />
            </div>
          ))}
        </Section>

        <Section title="Rosie numerals">
          {draft.rosieNumerals.map((item, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-2">
              <Field label="Numeral">
                <TextInput
                  value={item.numeral}
                  onChange={(v) => {
                    const rosieNumerals = draft.rosieNumerals.map((row, i) =>
                      i === index ? { ...row, numeral: v } : row
                    );
                    patch("rosieNumerals", rosieNumerals);
                  }}
                />
              </Field>
              <Field label="Label">
                <TextInput
                  value={item.label}
                  onChange={(v) => {
                    const rosieNumerals = draft.rosieNumerals.map((row, i) =>
                      i === index ? { ...row, label: v } : row
                    );
                    patch("rosieNumerals", rosieNumerals);
                  }}
                />
              </Field>
            </div>
          ))}
        </Section>

        <Section title="UI">
          <Field label="Lightbox close">
            <TextInput
              value={draft.ui.lightboxClose}
              onChange={(v) => patch("ui", { lightboxClose: v })}
            />
          </Field>
        </Section>
      </div>
    </>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 border-t border-neutral-800 pt-8 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium tracking-wide text-neutral-300 uppercase">{title}</h2>
        {href && <ViewOnSite href={href} />}
      </div>
      {children}
    </section>
  );
}
