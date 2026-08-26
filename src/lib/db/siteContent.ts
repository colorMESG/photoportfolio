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
] as const;

export type ContentKey = (typeof CONTENT_KEYS)[number];

/** Turns Postgres / RLS failures into something the form can show. */
function describe(error: { code?: string; message: string }): string {
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "The database refused this write. The signed-in account is not an administrator.";
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

export async function saveSiteSettings(draft: SettingsDraft): Promise<Result<SiteSettingsRow>> {
  const row = {
    id: true,
    brand_name: draft.brand_name.trim(),
    subtitle: nullify(draft.subtitle),
    email: nullify(draft.email),
    phone: nullify(draft.phone),
    phone_href: nullify(draft.phone_href),
    location: nullify(draft.location),
    instagram_handle: nullify(draft.instagram_handle),
    instagram_url: nullify(draft.instagram_url),
    seo_title: nullify(draft.seo_title),
    seo_description: nullify(draft.seo_description),
    og_image_path: nullify(draft.og_image_path),
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

export async function getContentBlocks(): Promise<Result<Record<string, Record<string, unknown>>>> {
  const { data, error } = await requireSupabase().from("content_blocks").select("*");
  if (error) return { data: null, error: describe(error) };
  const map: Record<string, Record<string, unknown>> = {};
  for (const row of (data as ContentBlockRow[]) ?? []) {
    map[row.key] = row.data ?? {};
  }
  return { data: map, error: null };
}

/**
 * Writes the About / Content form. Extra keys already on a block are preserved;
 * this screen overlays copy plus the Hero / About / Contact photograph fields.
 */
export async function saveContentDraft(draft: ContentDraft): Promise<Result<true>> {
  const existing = await getContentBlocks();
  if (existing.error) return { data: null, error: existing.error };

  const blocks = existing.data ?? {};
  const writes: { key: ContentKey; data: Record<string, unknown> }[] = [
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
  ];

  const { error } = await requireSupabase().from("content_blocks").upsert(writes);
  return { data: error ? null : true, error: error ? describe(error) : null };
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

function nullify(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
