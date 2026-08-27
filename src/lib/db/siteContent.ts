import type { ContentDraft, ContentImageDraft, SettingsDraft } from "../content/siteCopy";
import { requireSupabase } from "../supabase";
import type { ContentBlockRow, SiteSettingsRow } from "./types";

export interface Result<T> {
  data: T | null;
  error: string | null;
}

const CONTENT_KEYS = [
  "hero",
  "marquee",
  "statement",
  "about",
  "contact",
  "footer",
  "navigation",
  "headings",
  "ghost_words",
  "flycam_capabilities",
  "stats",
  "film_strip",
  "collage",
  "aerial_frames",
  "rosie_numerals",
  "ui_labels",
] as const;

export type ContentKey = (typeof CONTENT_KEYS)[number];

/** Turns Postgres / RLS failures into something the form can show. */
function describe(error: { code?: string; message: string }): string {
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "The database refused this write. The signed-in account is not an administrator.";
  }
  if (/column .* does not exist|schema cache/i.test(error.message)) {
    return `${error.message} Run supabase/migrations/0005_content_publish.sql in the SQL Editor.`;
  }
  return error.message;
}

export async function getSiteSettings(): Promise<Result<SiteSettingsRow>> {
  const { data, error } = await requireSupabase()
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  return {
    data: (data as SiteSettingsRow) ?? null,
    error: error ? describe(error) : null,
  };
}

export async function saveSiteSettingsDraft(draft: SettingsDraft): Promise<Result<SiteSettingsRow>> {
  const payload = settingsJson(draft);
  const { data, error } = await requireSupabase()
    .from("site_settings")
    .upsert({ id: true, draft: payload })
    .select()
    .single();
  return {
    data: (data as SiteSettingsRow) ?? null,
    error: error ? describe(error) : null,
  };
}

export async function publishSiteSettings(draft: SettingsDraft): Promise<Result<SiteSettingsRow>> {
  const payload = settingsJson(draft);
  const row = {
    id: true,
    brand_name: draft.brand_name.trim(),
    subtitle: nullify(draft.subtitle),
    year: nullify(draft.year),
    email: nullify(draft.email),
    phone: nullify(draft.phone),
    phone_href: nullify(draft.phone_href),
    location: nullify(draft.location),
    instagram_handle: nullify(draft.instagram_handle),
    instagram_url: nullify(draft.instagram_url),
    seo_title: nullify(draft.seo_title),
    seo_description: nullify(draft.seo_description),
    og_image_path: nullify(draft.og_image_path),
    favicon_path: nullify(draft.favicon_path),
    index_public: draft.index_public,
    draft: payload,
    published_at: new Date().toISOString(),
  };

  const { data, error } = await requireSupabase()
    .from("site_settings")
    .upsert(row)
    .select()
    .single();

  return {
    data: (data as SiteSettingsRow) ?? null,
    error: error ? describe(error) : null,
  };
}

export async function getContentBlockRows(): Promise<Result<ContentBlockRow[]>> {
  const { data, error } = await requireSupabase().from("content_blocks").select("*");
  return {
    data: (data as ContentBlockRow[]) ?? null,
    error: error ? describe(error) : null,
  };
}

export async function getContentBlocks(): Promise<Result<Record<string, Record<string, unknown>>>> {
  const rows = await getContentBlockRows();
  if (rows.error) return { data: null, error: rows.error };
  const map: Record<string, Record<string, unknown>> = {};
  for (const row of rows.data ?? []) {
    map[row.key] = row.data ?? {};
  }
  return { data: map, error: null };
}

export function blocksHaveUnpublishedDraft(rows: ContentBlockRow[]): boolean {
  return rows.some((row) => JSON.stringify(row.data ?? {}) !== JSON.stringify(row.published_data ?? {}));
}

/**
 * Writes the About / Content form to `data` only. Visitors keep seeing
 * `published_data` until Publish.
 */
export async function saveContentDraft(draft: ContentDraft): Promise<Result<true>> {
  return upsertContent(draft, false);
}

/** Saves the draft and copies it onto `published_data` so the public site updates. */
export async function publishContentDraft(draft: ContentDraft): Promise<Result<true>> {
  return upsertContent(draft, true);
}

async function upsertContent(draft: ContentDraft, publish: boolean): Promise<Result<true>> {
  const existing = await getContentBlocks();
  if (existing.error) return { data: null, error: existing.error };

  const blocks = existing.data ?? {};
  const now = new Date().toISOString();
  const writes = contentWrites(draft, blocks).map((write) => {
    if (!publish) return write;
    return {
      ...write,
      published_data: write.data,
      published_at: now,
    };
  });

  const { error } = await requireSupabase().from("content_blocks").upsert(writes);
  return { data: error ? null : true, error: error ? describe(error) : null };
}

function contentWrites(
  draft: ContentDraft,
  blocks: Record<string, Record<string, unknown>>
): { key: ContentKey; data: Record<string, unknown> }[] {
  return [
    {
      key: "hero",
      data: {
        ...blocks.hero,
        words: draft.hero.words,
        meta: draft.hero.meta,
        scrollLabel: draft.hero.scrollLabel,
        ...imageFields(draft.hero.image),
      },
    },
    {
      key: "marquee",
      data: { ...blocks.marquee, items: draft.marquee },
    },
    {
      key: "statement",
      data: {
        ...blocks.statement,
        lines: draft.statement.lines,
        paragraph: draft.statement.paragraph,
      },
    },
    {
      key: "about",
      data: {
        ...blocks.about,
        headings: draft.about.headings,
        paragraphs: draft.about.paragraphs,
        details: draft.about.details,
        ...imageFields(draft.about.image),
      },
    },
    {
      key: "contact",
      data: {
        ...blocks.contact,
        words: draft.contact.words,
        emailLabel: draft.contact.emailLabel,
        phoneLabel: draft.contact.phoneLabel,
        addressLabel: draft.contact.addressLabel,
        ...imageFields(draft.contact.image),
      },
    },
    {
      key: "footer",
      data: {
        ...blocks.footer,
        tagline: draft.footer.tagline,
        backToTop: draft.footer.backToTop,
        copyright: draft.footer.copyright,
      },
    },
    {
      key: "navigation",
      data: { ...blocks.navigation, links: draft.navigation },
    },
    {
      key: "headings",
      data: {
        ...blocks.headings,
        selectedWorks: draft.headings.selectedWorks,
        gallery: draft.headings.gallery,
        services: draft.headings.services,
        flycam: draft.headings.flycam,
        corporate: draft.headings.corporate,
      },
    },
    {
      key: "ghost_words",
      data: { ...blocks.ghost_words, ...draft.ghost },
    },
    {
      key: "flycam_capabilities",
      data: {
        ...blocks.flycam_capabilities,
        items: draft.flycamCapabilities.map((item) => ({
          label: item.label,
          value: item.val,
        })),
      },
    },
    {
      key: "stats",
      data: {
        ...blocks.stats,
        retouchLabel: draft.stats.retouchLabel,
        beforeLabel: draft.stats.beforeLabel,
        afterLabel: draft.stats.afterLabel,
        dragHint: draft.stats.dragHint,
        items: draft.stats.items,
        note: draft.stats.note,
      },
    },
    {
      key: "film_strip",
      data: {
        ...blocks.film_strip,
        heading: draft.filmStrip.heading,
        labels: draft.filmStrip.labels,
        frames: draft.filmStrip.frames.map((frame) => ({
          n: frame.n,
          loc: frame.loc,
          portrait: frame.portrait,
          ...imageFields(frame.image),
        })),
      },
    },
    {
      key: "collage",
      data: {
        ...blocks.collage,
        word: draft.collage.word,
        meta: draft.collage.meta,
        ...imageFields(draft.collage.background),
        overlays: draft.collage.overlays.map((image) => imageFields(image)),
      },
    },
    {
      key: "aerial_frames",
      data: {
        ...blocks.aerial_frames,
        items: draft.aerialFrames.map((frame) => ({
          loc: frame.loc,
          region: frame.region,
          altitude: frame.altitude,
          ...imageFields(frame.image),
        })),
      },
    },
    {
      key: "rosie_numerals",
      data: {
        ...blocks.rosie_numerals,
        items: draft.rosieNumerals,
      },
    },
    {
      key: "ui_labels",
      data: { ...blocks.ui_labels, lightboxClose: draft.ui.lightboxClose },
    },
  ];
}

function imageFields(image: ContentImageDraft): Record<string, unknown> {
  return {
    image_path: image.image_path,
    image_alt: image.image_alt.trim() || null,
    image_width: image.image_width,
    image_height: image.image_height,
    focal_point_x: image.focal_point_x,
    focal_point_y: image.focal_point_y,
  };
}

function settingsJson(draft: SettingsDraft): Record<string, unknown> {
  return {
    brand_name: draft.brand_name.trim(),
    subtitle: draft.subtitle.trim(),
    year: draft.year.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    phone_href: draft.phone_href.trim(),
    location: draft.location.trim(),
    instagram_handle: draft.instagram_handle.trim(),
    instagram_url: draft.instagram_url.trim(),
    seo_title: draft.seo_title.trim(),
    seo_description: draft.seo_description.trim(),
    og_image_path: draft.og_image_path.trim(),
    favicon_path: draft.favicon_path.trim(),
    index_public: draft.index_public,
  };
}

function nullify(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
