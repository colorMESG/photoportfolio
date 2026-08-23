/**
 * Public site copy resolution.
 *
 * First paint is always the static snapshot in `src/content/`. After mount, any
 * managed value from Supabase overlays that snapshot. A missing row, an empty
 * field, or an unreachable project falls back to static. Photographs stay on
 * their static URLs unless a storage path has been saved — Unsplash placeholders
 * are never copied into Storage.
 *
 * The public fetch uses PostgREST directly so the visitor bundle does not pull
 * in supabase-js (that client stays in the lazy admin chunk).
 */

import {
  aboutContent,
  contactContent,
  footerContent,
  heroContent,
  marqueeItems,
  servicesContent,
  siteSettings,
  statementContent,
  uiLabels,
} from "../../content/site";
import type { ContactInfo, NavLink, ProjectImage, SiteSettings } from "../../content/types";
import type { ContentBlockRow, SiteSettingsRow } from "../db/types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "../env";
import { imageUrl } from "../images";

export type HeroCopy = typeof heroContent;
export type StatementCopy = typeof statementContent;
export type AboutCopy = typeof aboutContent;
export type ContactCopy = typeof contactContent;
export type FooterCopy = typeof footerContent;

export interface SiteCopy {
  settings: SiteSettings;
  hero: HeroCopy;
  marquee: string[];
  statement: StatementCopy;
  services: typeof servicesContent;
  about: AboutCopy;
  contact: ContactCopy;
  footer: FooterCopy;
  ui: typeof uiLabels;
}

export interface ManagedContent {
  settings: SiteSettingsRow | null;
  blocks: Record<string, Record<string, unknown>>;
}

export interface ContentDraft {
  hero: { words: string[]; meta: string[]; scrollLabel: string };
  marquee: string[];
  statement: { lines: string[]; paragraph: string };
  about: { headings: string[]; paragraphs: string[]; details: string[] };
  contact: { words: string[]; emailLabel: string; phoneLabel: string; addressLabel: string };
  footer: { tagline: string; backToTop: string; copyright: string };
  navigation: NavLink[];
}

export interface SettingsDraft {
  brand_name: string;
  subtitle: string;
  email: string;
  phone: string;
  phone_href: string;
  location: string;
  instagram_handle: string;
  instagram_url: string;
  seo_title: string;
  seo_description: string;
  og_image_path: string;
}

/** SEO strings the seed ships with; used when the settings row has no value yet. */
export const staticSeo = {
  title: `${siteSettings.name} — ${siteSettings.tagline}`,
  description:
    "Nhiếp ảnh gia tại Thành phố Hồ Chí Minh. Chân dung, editorial, sự kiện doanh nghiệp và flycam.",
};

export function staticSiteCopy(): SiteCopy {
  return {
    settings: siteSettings,
    hero: heroContent,
    marquee: [...marqueeItems],
    statement: statementContent,
    services: servicesContent,
    about: aboutContent,
    contact: contactContent,
    footer: footerContent,
    ui: uiLabels,
  };
}

export function resolveSiteCopy(managed: ManagedContent | null): SiteCopy {
  const base = staticSiteCopy();
  if (!managed) return base;

  const settings = mergeSettings(base.settings, managed.settings, managed.blocks.navigation);
  return {
    ...base,
    settings,
    hero: mergeHero(base.hero, managed.blocks.hero),
    marquee: stringList(managed.blocks.marquee?.items) ?? base.marquee,
    statement: mergeStatement(base.statement, managed.blocks.statement),
    about: mergeAbout(base.about, managed.blocks.about),
    contact: mergeContact(base.contact, managed.blocks.contact, settings.contact),
    footer: mergeFooter(base.footer, managed.blocks.footer, settings),
  };
}

export function siteCopyEqual(a: SiteCopy, b: SiteCopy): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function contentDraftFromCopy(copy: SiteCopy): ContentDraft {
  return {
    hero: {
      words: [...copy.hero.words],
      meta: [...copy.hero.meta],
      scrollLabel: copy.hero.scrollLabel,
    },
    marquee: [...copy.marquee],
    statement: { lines: [...copy.statement.lines], paragraph: copy.statement.paragraph },
    about: {
      headings: [...copy.about.headings],
      paragraphs: [...copy.about.paragraphs],
      details: [...copy.about.details],
    },
    contact: {
      words: [...copy.contact.words],
      emailLabel: copy.contact.links[0]?.label ?? "Email",
      phoneLabel: copy.contact.links[1]?.label ?? "Điện thoại",
      addressLabel: copy.contact.addressLabel,
    },
    footer: {
      tagline: copy.footer.tagline,
      backToTop: copy.footer.backToTop,
      copyright: copy.footer.copyright,
    },
    navigation: copy.settings.nav.map((link) => ({ ...link })),
  };
}

export function settingsDraftFrom(
  copy: SiteCopy,
  row: SiteSettingsRow | null
): SettingsDraft {
  const contact = copy.settings.contact;
  return {
    brand_name: nonEmpty(row?.brand_name) || copy.settings.name,
    subtitle: nonEmpty(row?.subtitle) || copy.settings.tagline,
    email: nonEmpty(row?.email) || contact.email,
    phone: nonEmpty(row?.phone) || contact.phone,
    phone_href: nonEmpty(row?.phone_href) || contact.phoneHref,
    location: nonEmpty(row?.location) || contact.location,
    instagram_handle: nonEmpty(row?.instagram_handle) || contact.instagramHandle || "",
    instagram_url: nonEmpty(row?.instagram_url) || contact.instagramUrl || "",
    seo_title: nonEmpty(row?.seo_title) || staticSeo.title,
    seo_description: nonEmpty(row?.seo_description) || staticSeo.description,
    og_image_path: nonEmpty(row?.og_image_path) || "",
  };
}

export function hasManagedImage(data: Record<string, unknown> | undefined): boolean {
  return Boolean(text(data?.image_path)?.trim());
}

/**
 * Loads the managed overlay. Returns null when Supabase is unconfigured or
 * unreachable so the caller keeps rendering the static snapshot.
 */
export async function fetchManagedContent(): Promise<ManagedContent | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const [settings, blocks] = await Promise.all([
      restRows<SiteSettingsRow>("site_settings"),
      restRows<ContentBlockRow>("content_blocks"),
    ]);
    if (settings === null && blocks === null) return null;
    const map: Record<string, Record<string, unknown>> = {};
    for (const row of blocks ?? []) {
      if (row?.key && isRecord(row.data)) map[row.key] = row.data;
    }
    return {
      settings: settings?.[0] ?? null,
      blocks: map,
    };
  } catch {
    return null;
  }
}

async function restRows<T>(table: string): Promise<T[] | null> {
  const base = supabaseUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });
  if (!response.ok) return null;
  const json = (await response.json()) as T[];
  return Array.isArray(json) ? json : null;
}

function mergeSettings(
  fallback: SiteSettings,
  row: SiteSettingsRow | null,
  navigation: Record<string, unknown> | undefined
): SiteSettings {
  const nav = navLinks(navigation?.links) ?? fallback.nav;
  if (!row) return { ...fallback, nav };

  const contact: ContactInfo = {
    ...fallback.contact,
    email: nonEmpty(row.email) || fallback.contact.email,
    phone: nonEmpty(row.phone) || fallback.contact.phone,
    phoneHref: nonEmpty(row.phone_href) || fallback.contact.phoneHref,
    location: nonEmpty(row.location) || fallback.contact.location,
    instagramHandle: nonEmpty(row.instagram_handle) || fallback.contact.instagramHandle,
    instagramUrl: nonEmpty(row.instagram_url) || fallback.contact.instagramUrl,
  };

  return {
    ...fallback,
    name: nonEmpty(row.brand_name) || fallback.name,
    tagline: nonEmpty(row.subtitle) || fallback.tagline,
    nav,
    contact,
  };
}

function mergeHero(fallback: HeroCopy, data?: Record<string, unknown>): HeroCopy {
  if (!data) return fallback;
  return {
    ...fallback,
    words: stringList(data.words) ?? fallback.words,
    meta: stringList(data.meta) ?? fallback.meta,
    scrollLabel: nonEmpty(text(data.scrollLabel)) || fallback.scrollLabel,
    image: resolveImage(fallback.image, data),
  };
}

function mergeStatement(
  fallback: StatementCopy,
  data?: Record<string, unknown>
): StatementCopy {
  if (!data) return fallback;
  return {
    ...fallback,
    lines: stringList(data.lines) ?? fallback.lines,
    paragraph: nonEmpty(text(data.paragraph)) || fallback.paragraph,
  };
}

function mergeAbout(fallback: AboutCopy, data?: Record<string, unknown>): AboutCopy {
  if (!data) return fallback;
  return {
    ...fallback,
    headings: stringList(data.headings) ?? fallback.headings,
    paragraphs: stringList(data.paragraphs) ?? fallback.paragraphs,
    details: stringList(data.details) ?? fallback.details,
    image: resolveImage(fallback.image, data),
  };
}

function mergeContact(
  fallback: ContactCopy,
  data: Record<string, unknown> | undefined,
  contact: ContactInfo
): ContactCopy {
  const emailLabel =
    nonEmpty(text(data?.emailLabel)) || fallback.links[0]?.label || "Email";
  const phoneLabel =
    nonEmpty(text(data?.phoneLabel)) || fallback.links[1]?.label || "Điện thoại";

  return {
    ...fallback,
    words: stringList(data?.words) ?? fallback.words,
    addressLabel: nonEmpty(text(data?.addressLabel)) || fallback.addressLabel,
    address: contact.location,
    links: [
      { label: emailLabel, val: contact.email, href: `mailto:${contact.email}` },
      { label: phoneLabel, val: contact.phone, href: contact.phoneHref },
    ],
    image: resolveImage(fallback.image, data),
  };
}

function mergeFooter(
  fallback: FooterCopy,
  data: Record<string, unknown> | undefined,
  settings: SiteSettings
): FooterCopy {
  return {
    ...fallback,
    tagline: nonEmpty(text(data?.tagline)) || fallback.tagline,
    backToTop: nonEmpty(text(data?.backToTop)) || fallback.backToTop,
    copyright: nonEmpty(text(data?.copyright)) || fallback.copyright,
    links: [
      { label: "Email", href: `mailto:${settings.contact.email}` },
      { label: settings.contact.phone, href: settings.contact.phoneHref },
    ],
  };
}

function resolveImage<T extends ProjectImage>(
  fallback: T,
  data: Record<string, unknown> | undefined
): T {
  const path = text(data?.image_path)?.trim();
  if (!path) return fallback;
  const alt = nonEmpty(text(data?.image_alt));
  return {
    ...fallback,
    src: imageUrl(path),
    alt: alt || fallback.alt,
  };
}

function navLinks(value: unknown): NavLink[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const links: NavLink[] = [];
  for (const item of value) {
    if (!isRecord(item)) return undefined;
    const label = text(item.label);
    const href = text(item.href);
    if (!label || !href) return undefined;
    links.push({ label, href });
  }
  return links;
}

function stringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  if (!value.every((item) => typeof item === "string")) return undefined;
  return value;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function nonEmpty(value: string | null | undefined): string {
  return value?.trim() ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
