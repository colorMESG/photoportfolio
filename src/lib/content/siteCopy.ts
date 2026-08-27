/**
 * Public site copy resolution.
 *
 * First paint is always the static snapshot in `src/content/`. After mount, any
 * published managed value from Supabase overlays that snapshot. A missing row,
 * an empty field, or an unreachable project falls back to static. Photographs
 * stay on their static URLs unless a storage path has been saved — Unsplash
 * placeholders are never copied into Storage.
 *
 * The public fetch uses PostgREST directly so the visitor bundle does not pull
 * in supabase-js (that client stays in the lazy admin chunk).
 */

import {
  corporateHeading,
  eventsLabel,
  eventsWord,
  headshotsLabel,
  retouchContent,
  teamsLabel,
} from "../../content/corporate";
import {
  aerialFrames as staticAerialFrames,
  flycamCapabilities as staticFlycamCapabilities,
  flycamHeading,
  flycamOverlayWord,
} from "../../content/flycam";
import { galleryHeading, personalGallery } from "../../content/gallery";
import {
  collage as staticCollage,
  filmStripContent as staticFilmStrip,
  locationSeriesWord,
  rosieNumerals as staticRosieNumerals,
  selectedWorksHeading,
} from "../../content/projects";
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
import type {
  AerialFrame,
  ContactInfo,
  FilmStripFrame,
  GalleryImage,
  NavLink,
  ProjectImage,
  ServiceItem,
  SiteSettings,
  StatItem,
} from "../../content/types";
import type { ContentBlockRow, GalleryImageRow, ServiceRow, SiteSettingsRow } from "../db/types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "../env";
import { imageUrl } from "../images";

export type HeroCopy = Omit<typeof heroContent, "image"> & { image: ProjectImage };
export type StatementCopy = typeof statementContent;
export type AboutCopy = Omit<typeof aboutContent, "image"> & { image: ProjectImage };
export type ContactCopy = Omit<typeof contactContent, "image"> & { image: ProjectImage };
export type FooterCopy = typeof footerContent;
export type CollageCopy = typeof staticCollage;
export type FilmStripCopy = typeof staticFilmStrip;
export type RetouchCopy = typeof retouchContent;
export type HeadingsCopy = {
  selectedWorks: { lines: [string, string] };
  gallery: { lines: [string, string] };
  services: { eyebrow: string; heading: string };
  flycam: { eyebrow: string; lines: [string, string]; description: string };
  corporate: {
    eyebrow: string;
    lines: [string, string];
    description: string;
    headshotsLabel: string;
    eventsLabel: string;
    teamsLabel: string;
  };
};
export type GhostCopy = {
  locationSeries: string;
  events: string;
  flycam: string;
  collage: string;
  stats: string;
};

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
  headings: HeadingsCopy;
  ghost: GhostCopy;
  flycamCapabilities: typeof staticFlycamCapabilities;
  retouch: RetouchCopy;
  filmStrip: FilmStripCopy;
  collage: CollageCopy;
  aerialFrames: AerialFrame[];
  rosieNumerals: typeof staticRosieNumerals;
  gallery: GalleryImage[];
}

export interface ManagedContent {
  settings: SiteSettingsRow | null;
  blocks: Record<string, Record<string, unknown>>;
  services: ServiceRow[];
  gallery: GalleryImageRow[];
}

/** Photograph fields stored on a content_block. Focal points land in Phase 9. */
export interface ContentImageDraft {
  image_path: string | null;
  image_alt: string;
  image_width: number | null;
  image_height: number | null;
  focal_point_x: number;
  focal_point_y: number;
}

export interface FilmFrameDraft {
  n: string;
  loc: string;
  portrait: boolean;
  image: ContentImageDraft;
}

export interface AerialFrameDraft {
  loc: string;
  region: string;
  altitude: string;
  image: ContentImageDraft;
}

export interface ContentDraft {
  hero: { words: string[]; meta: string[]; scrollLabel: string; image: ContentImageDraft };
  marquee: string[];
  statement: { lines: string[]; paragraph: string };
  about: { headings: string[]; paragraphs: string[]; details: string[]; image: ContentImageDraft };
  contact: {
    words: string[];
    emailLabel: string;
    phoneLabel: string;
    addressLabel: string;
    image: ContentImageDraft;
  };
  footer: { tagline: string; backToTop: string; copyright: string };
  navigation: NavLink[];
  headings: HeadingsCopy;
  ghost: GhostCopy;
  flycamCapabilities: { label: string; val: string }[];
  stats: {
    retouchLabel: string;
    beforeLabel: string;
    afterLabel: string;
    dragHint: string;
    items: { target: number; suffix: string; label: string }[];
    note: string;
  };
  filmStrip: { heading: string; labels: string[]; frames: FilmFrameDraft[] };
  collage: {
    word: string;
    meta: string[];
    background: ContentImageDraft;
    overlays: ContentImageDraft[];
  };
  aerialFrames: AerialFrameDraft[];
  rosieNumerals: { numeral: string; label: string }[];
  ui: { lightboxClose: string };
}

export interface SettingsDraft {
  brand_name: string;
  subtitle: string;
  year: string;
  email: string;
  phone: string;
  phone_href: string;
  location: string;
  instagram_handle: string;
  instagram_url: string;
  seo_title: string;
  seo_description: string;
  og_image_path: string;
  favicon_path: string;
  index_public: boolean;
}

/** SEO strings the seed ships with; used when the settings row has no value yet. */
export const staticSeo = {
  title: siteSettings.seoTitle,
  description: siteSettings.seoDescription,
};

export function staticSiteCopy(): SiteCopy {
  return {
    settings: { ...siteSettings, nav: siteSettings.nav.map((link) => ({ ...link })) },
    hero: heroContent,
    marquee: [...marqueeItems],
    statement: statementContent,
    services: {
      ...servicesContent,
      items: servicesContent.items.map((item) => ({ ...item })),
    },
    about: aboutContent,
    contact: contactContent,
    footer: footerContent,
    ui: { ...uiLabels },
    headings: {
      selectedWorks: { lines: [...selectedWorksHeading.lines] as [string, string] },
      gallery: { lines: [...galleryHeading.lines] as [string, string] },
      services: { eyebrow: servicesContent.eyebrow, heading: servicesContent.heading },
      flycam: {
        eyebrow: flycamHeading.eyebrow,
        lines: [...flycamHeading.lines] as [string, string],
        description: flycamHeading.description,
      },
      corporate: {
        eyebrow: corporateHeading.eyebrow,
        lines: [...corporateHeading.lines] as [string, string],
        description: corporateHeading.description,
        headshotsLabel,
        eventsLabel,
        teamsLabel,
      },
    },
    ghost: {
      locationSeries: locationSeriesWord,
      events: eventsWord,
      flycam: flycamOverlayWord,
      collage: staticCollage.word,
      stats: retouchContent.statsWord,
    },
    flycamCapabilities: staticFlycamCapabilities.map((item) => ({ ...item })),
    retouch: {
      ...retouchContent,
      stats: retouchContent.stats.map((item) => ({ ...item })),
    },
    filmStrip: {
      ...staticFilmStrip,
      labels: [...staticFilmStrip.labels],
      frames: staticFilmStrip.frames.map((frame) => ({ ...frame })),
    },
    collage: {
      ...staticCollage,
      overlays: staticCollage.overlays.map((image) => ({ ...image })),
      meta: [...staticCollage.meta],
    },
    aerialFrames: staticAerialFrames.map((frame) => ({ ...frame })),
    rosieNumerals: staticRosieNumerals.map((item) => ({ ...item })),
    gallery: personalGallery.map((image) => ({ ...image })),
  };
}

export function resolveSiteCopy(managed: ManagedContent | null): SiteCopy {
  const base = staticSiteCopy();
  if (!managed) return base;

  const settings = mergeSettings(base.settings, managed.settings, managed.blocks.navigation);
  const headings = mergeHeadings(base.headings, managed.blocks.headings);
  const ghost = mergeGhost(base.ghost, managed.blocks.ghost_words);
  const servicesHeading = headings.services;

  return {
    ...base,
    settings,
    hero: mergeHero(base.hero, managed.blocks.hero),
    marquee: stringList(managed.blocks.marquee?.items) ?? base.marquee,
    statement: mergeStatement(base.statement, managed.blocks.statement),
    services: {
      eyebrow: servicesHeading.eyebrow,
      heading: servicesHeading.heading,
      items: mergeServices(base.services.items, managed.services),
    },
    about: mergeAbout(base.about, managed.blocks.about),
    contact: mergeContact(base.contact, managed.blocks.contact, settings.contact),
    footer: mergeFooter(base.footer, managed.blocks.footer, settings),
    ui: {
      lightboxClose:
        nonEmpty(text(managed.blocks.ui_labels?.lightboxClose)) || base.ui.lightboxClose,
    },
    headings,
    ghost,
    flycamCapabilities: mergeCapabilities(
      base.flycamCapabilities,
      managed.blocks.flycam_capabilities
    ),
    retouch: mergeRetouch(base.retouch, managed.blocks.stats, ghost.stats),
    filmStrip: mergeFilmStrip(base.filmStrip, managed.blocks.film_strip),
    collage: mergeCollage(base.collage, managed.blocks.collage, ghost.collage),
    aerialFrames: mergeAerialFrames(base.aerialFrames, managed.blocks.aerial_frames),
    rosieNumerals: mergeRosie(base.rosieNumerals, managed.blocks.rosie_numerals),
    gallery: mergeGallery(base.gallery, managed.gallery),
  };
}

export function siteCopyEqual(a: SiteCopy, b: SiteCopy): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function contentDraftFromCopy(
  copy: SiteCopy,
  managed?: ManagedContent | null
): ContentDraft {
  const blocks = managed?.blocks;
  return {
    hero: {
      words: [...copy.hero.words],
      meta: [...copy.hero.meta],
      scrollLabel: copy.hero.scrollLabel,
      image: imageDraftFrom(copy.hero.image.alt, blocks?.hero),
    },
    marquee: [...copy.marquee],
    statement: { lines: [...copy.statement.lines], paragraph: copy.statement.paragraph },
    about: {
      headings: [...copy.about.headings],
      paragraphs: [...copy.about.paragraphs],
      details: [...copy.about.details],
      image: imageDraftFrom(copy.about.image.alt, blocks?.about),
    },
    contact: {
      words: [...copy.contact.words],
      emailLabel: copy.contact.links[0]?.label ?? "Email",
      phoneLabel: copy.contact.links[1]?.label ?? "Điện thoại",
      addressLabel: copy.contact.addressLabel,
      image: imageDraftFrom(copy.contact.image.alt, blocks?.contact),
    },
    footer: {
      tagline: copy.footer.tagline,
      backToTop: copy.footer.backToTop,
      copyright: copy.footer.copyright,
    },
    navigation: copy.settings.nav.map((link) => ({ ...link })),
    headings: {
      selectedWorks: { lines: [...copy.headings.selectedWorks.lines] as [string, string] },
      gallery: { lines: [...copy.headings.gallery.lines] as [string, string] },
      services: { ...copy.headings.services },
      flycam: {
        ...copy.headings.flycam,
        lines: [...copy.headings.flycam.lines] as [string, string],
      },
      corporate: {
        ...copy.headings.corporate,
        lines: [...copy.headings.corporate.lines] as [string, string],
      },
    },
    ghost: { ...copy.ghost },
    flycamCapabilities: copy.flycamCapabilities.map(({ label, val }) => ({ label, val })),
    stats: {
      retouchLabel: copy.retouch.label,
      beforeLabel: copy.retouch.beforeLabel,
      afterLabel: copy.retouch.afterLabel,
      dragHint: copy.retouch.dragHint,
      items: copy.retouch.stats.map(({ target, suffix, label }) => ({ target, suffix, label })),
      note: copy.retouch.note,
    },
    filmStrip: {
      heading: copy.filmStrip.heading,
      labels: [...copy.filmStrip.labels],
      frames: copy.filmStrip.frames.map((frame, index) => ({
        n: frame.n,
        loc: frame.loc,
        portrait: frame.portrait,
        image: imageDraftFrom(
          frame.loc,
          frameRecord(blocks?.film_strip?.frames, index) ?? { image_alt: frame.loc }
        ),
      })),
    },
    collage: {
      word: copy.collage.word,
      meta: [...copy.collage.meta],
      background: imageDraftFrom(copy.collage.background.alt, blocks?.collage),
      overlays: copy.collage.overlays.map((image, index) =>
        imageDraftFrom(image.alt, overlayRecord(blocks?.collage, index))
      ),
    },
    aerialFrames: copy.aerialFrames.map((frame, index) => ({
      loc: frame.loc,
      region: frame.region,
      altitude: frame.altitude,
      image: imageDraftFrom(frame.loc, frameRecord(blocks?.aerial_frames?.items, index)),
    })),
    rosieNumerals: copy.rosieNumerals.map(({ numeral, label }) => ({ numeral, label })),
    ui: { lightboxClose: copy.ui.lightboxClose },
  };
}

export function settingsDraftFrom(copy: SiteCopy, row: SiteSettingsRow | null): SettingsDraft {
  const contact = copy.settings.contact;
  const fromDraft = isRecord(row?.draft) ? row.draft : null;
  const pick = (key: string, fallback: string) =>
    nonEmpty(text(fromDraft?.[key])) || fallback;

  return {
    brand_name: pick("brand_name", nonEmpty(row?.brand_name) || copy.settings.name),
    subtitle: pick("subtitle", nonEmpty(row?.subtitle) || copy.settings.tagline),
    year: pick("year", nonEmpty(row?.year) || copy.settings.year),
    email: pick("email", nonEmpty(row?.email) || contact.email),
    phone: pick("phone", nonEmpty(row?.phone) || contact.phone),
    phone_href: pick("phone_href", nonEmpty(row?.phone_href) || contact.phoneHref),
    location: pick("location", nonEmpty(row?.location) || contact.location),
    instagram_handle: pick(
      "instagram_handle",
      nonEmpty(row?.instagram_handle) || contact.instagramHandle || ""
    ),
    instagram_url: pick(
      "instagram_url",
      nonEmpty(row?.instagram_url) || contact.instagramUrl || ""
    ),
    seo_title: pick("seo_title", nonEmpty(row?.seo_title) || staticSeo.title),
    seo_description: pick(
      "seo_description",
      nonEmpty(row?.seo_description) || staticSeo.description
    ),
    og_image_path: pick("og_image_path", nonEmpty(row?.og_image_path) || ""),
    favicon_path: pick("favicon_path", nonEmpty(row?.favicon_path) || ""),
    index_public:
      typeof fromDraft?.index_public === "boolean"
        ? fromDraft.index_public
        : Boolean(row?.index_public),
  };
}

export function hasManagedImage(data: Record<string, unknown> | undefined): boolean {
  return Boolean(text(data?.image_path)?.trim());
}

export function applyDocumentHead(copy: SiteCopy): void {
  if (typeof document === "undefined") return;
  const { settings } = copy;
  document.title = settings.seoTitle || document.title;

  setMeta("name", "description", settings.seoDescription);
  setMeta("property", "og:title", settings.seoTitle);
  setMeta("property", "og:description", settings.seoDescription);
  if (settings.ogImageSrc) setMeta("property", "og:image", settings.ogImageSrc);
  setMeta(
    "name",
    "robots",
    settings.indexPublic ? "index,follow" : "noindex,nofollow"
  );

  if (settings.faviconSrc) {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = settings.faviconSrc;
  }
}

/**
 * Loads the published overlay. Returns null when Supabase is unconfigured or
 * unreachable so the caller keeps rendering the static snapshot.
 *
 * Prefers the published views so a draft cannot leak to anonymous visitors.
 * Falls back to the raw tables only when those views do not exist yet.
 */
export async function fetchManagedContent(): Promise<ManagedContent | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const [
      publishedSettings,
      publishedBlocks,
      tableSettings,
      tableBlocks,
      services,
      gallery,
    ] = await Promise.all([
      restRows<SiteSettingsRow>("site_settings_published?select=*"),
      restRows<ContentBlockRow>("content_blocks_published?select=key,data"),
      restRows<SiteSettingsRow>("site_settings?select=*"),
      restRows<ContentBlockRow>("content_blocks?select=key,data"),
      restRows<ServiceRow>("services?published=eq.true&select=*&order=sort_order.asc"),
      restRows<GalleryImageRow>(
        "gallery_images?published=eq.true&select=*&order=sort_order.asc"
      ),
    ]);

    const settingsRows = publishedSettings !== null ? publishedSettings : tableSettings;
    const blockRows = publishedBlocks !== null ? publishedBlocks : tableBlocks;
    if (settingsRows === null && blockRows === null && services === null && gallery === null) {
      return null;
    }

    const map: Record<string, Record<string, unknown>> = {};
    for (const row of blockRows ?? []) {
      if (row?.key && isRecord(row.data)) map[row.key] = row.data;
    }
    return {
      settings: settingsRows?.[0] ?? null,
      blocks: map,
      services: services ?? [],
      gallery: gallery ?? [],
    };
  } catch {
    return null;
  }
}

async function restRows<T>(path: string): Promise<T[] | null> {
  const base = supabaseUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/rest/v1/${path}`, {
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

  const ogPath = nonEmpty(row.og_image_path);
  const faviconPath = nonEmpty(row.favicon_path);

  return {
    ...fallback,
    name: nonEmpty(row.brand_name) || fallback.name,
    tagline: nonEmpty(row.subtitle) || fallback.tagline,
    year: nonEmpty(row.year) || fallback.year,
    nav,
    contact,
    seoTitle: nonEmpty(row.seo_title) || fallback.seoTitle,
    seoDescription: nonEmpty(row.seo_description) || fallback.seoDescription,
    ogImageSrc: ogPath ? imageUrl(ogPath) : fallback.ogImageSrc,
    faviconSrc: faviconPath ? imageUrl(faviconPath) : fallback.faviconSrc,
    indexPublic: Boolean(row.index_public),
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

function mergeHeadings(
  fallback: HeadingsCopy,
  data?: Record<string, unknown>
): HeadingsCopy {
  if (!data) return fallback;
  const selected = isRecord(data.selectedWorks) ? data.selectedWorks : undefined;
  const gallery = isRecord(data.gallery) ? data.gallery : undefined;
  const services = isRecord(data.services) ? data.services : undefined;
  const flycam = isRecord(data.flycam) ? data.flycam : undefined;
  const corporate = isRecord(data.corporate) ? data.corporate : undefined;
  const selectedLines = pair(selected?.lines) ?? fallback.selectedWorks.lines;
  const galleryLines = pair(gallery?.lines) ?? fallback.gallery.lines;
  const flycamLines = pair(flycam?.lines) ?? fallback.flycam.lines;
  const corporateLines = pair(corporate?.lines) ?? fallback.corporate.lines;

  return {
    selectedWorks: { lines: selectedLines },
    gallery: { lines: galleryLines },
    services: {
      eyebrow: nonEmpty(text(services?.eyebrow)) || fallback.services.eyebrow,
      heading: nonEmpty(text(services?.heading)) || fallback.services.heading,
    },
    flycam: {
      eyebrow: nonEmpty(text(flycam?.eyebrow)) || fallback.flycam.eyebrow,
      lines: flycamLines,
      description: nonEmpty(text(flycam?.description)) || fallback.flycam.description,
    },
    corporate: {
      eyebrow: nonEmpty(text(corporate?.eyebrow)) || fallback.corporate.eyebrow,
      lines: corporateLines,
      description: nonEmpty(text(corporate?.description)) || fallback.corporate.description,
      headshotsLabel:
        nonEmpty(text(corporate?.headshotsLabel)) || fallback.corporate.headshotsLabel,
      eventsLabel: nonEmpty(text(corporate?.eventsLabel)) || fallback.corporate.eventsLabel,
      teamsLabel: nonEmpty(text(corporate?.teamsLabel)) || fallback.corporate.teamsLabel,
    },
  };
}

function mergeGhost(fallback: GhostCopy, data?: Record<string, unknown>): GhostCopy {
  if (!data) return fallback;
  return {
    locationSeries: nonEmpty(text(data.locationSeries)) || fallback.locationSeries,
    events: nonEmpty(text(data.events)) || fallback.events,
    flycam: nonEmpty(text(data.flycam)) || fallback.flycam,
    collage: nonEmpty(text(data.collage)) || fallback.collage,
    stats: nonEmpty(text(data.stats)) || fallback.stats,
  };
}

function mergeCapabilities(
  fallback: SiteCopy["flycamCapabilities"],
  data?: Record<string, unknown>
): SiteCopy["flycamCapabilities"] {
  const items = Array.isArray(data?.items) ? data.items : null;
  if (!items || items.length === 0) return fallback;
  return items.map((item, index) => {
    const record = isRecord(item) ? item : {};
    const slot = fallback[index];
    return {
      id: slot?.id ?? `cap-${index}`,
      label: nonEmpty(text(record.label)) || slot?.label || "",
      val: nonEmpty(text(record.value) || text(record.val)) || slot?.val || "",
    };
  });
}

function mergeRetouch(
  fallback: RetouchCopy,
  data: Record<string, unknown> | undefined,
  statsWord: string
): RetouchCopy {
  const items = Array.isArray(data?.items) ? data.items : null;
  const stats: StatItem[] = items?.length
    ? items.map((item, index) => {
        const record = isRecord(item) ? item : {};
        const slot = fallback.stats[index];
        return {
          id: slot?.id ?? `stat-${index}`,
          target: num(record.target) ?? slot?.target ?? 0,
          suffix: nonEmpty(text(record.suffix)) || slot?.suffix || "",
          label: nonEmpty(text(record.label)) || slot?.label || "",
        };
      })
    : fallback.stats;

  return {
    ...fallback,
    label: nonEmpty(text(data?.retouchLabel)) || fallback.label,
    beforeLabel: nonEmpty(text(data?.beforeLabel)) || fallback.beforeLabel,
    afterLabel: nonEmpty(text(data?.afterLabel)) || fallback.afterLabel,
    dragHint: nonEmpty(text(data?.dragHint)) || fallback.dragHint,
    statsWord,
    stats,
    note: nonEmpty(text(data?.note)) || fallback.note,
  };
}

function mergeFilmStrip(
  fallback: FilmStripCopy,
  data?: Record<string, unknown>
): FilmStripCopy {
  const labels = stringList(data?.labels) ?? fallback.labels;
  const framesRaw = Array.isArray(data?.frames) ? data.frames : null;
  const frames: FilmStripFrame[] = fallback.frames.map((slot, index) => {
    const record = framesRaw && isRecord(framesRaw[index]) ? framesRaw[index] : undefined;
    const image = resolveImage(
      { id: slot.id, src: slot.src, alt: slot.loc },
      record
    );
    return {
      ...slot,
      n: nonEmpty(text(record?.n)) || slot.n,
      loc: nonEmpty(text(record?.loc)) || slot.loc,
      portrait: typeof record?.portrait === "boolean" ? record.portrait : slot.portrait,
      src: image.src,
    };
  });

  return {
    heading: nonEmpty(text(data?.heading)) || fallback.heading,
    labels,
    frames,
  };
}

function mergeCollage(
  fallback: CollageCopy,
  data: Record<string, unknown> | undefined,
  word: string
): CollageCopy {
  const overlaysRaw = Array.isArray(data?.overlays) ? data.overlays : null;
  return {
    background: resolveImage(fallback.background, data),
    overlays: fallback.overlays.map((slot, index) =>
      resolveImage(slot, overlaysRaw && isRecord(overlaysRaw[index]) ? overlaysRaw[index] : undefined)
    ),
    meta: stringList(data?.meta) ?? fallback.meta,
    word: nonEmpty(text(data?.word)) || word || fallback.word,
  };
}

function mergeAerialFrames(
  fallback: AerialFrame[],
  data?: Record<string, unknown>
): AerialFrame[] {
  const items = Array.isArray(data?.items) ? data.items : null;
  return fallback.map((slot, index) => {
    const record = items && isRecord(items[index]) ? items[index] : undefined;
    const image = resolveImage(
      { id: slot.id, src: slot.src, alt: slot.loc },
      record
    );
    return {
      ...slot,
      src: image.src,
      loc: nonEmpty(text(record?.loc)) || slot.loc,
      region: nonEmpty(text(record?.region)) || slot.region,
      altitude: nonEmpty(text(record?.altitude)) || slot.altitude,
    };
  });
}

function mergeRosie(
  fallback: SiteCopy["rosieNumerals"],
  data?: Record<string, unknown>
): SiteCopy["rosieNumerals"] {
  const items = Array.isArray(data?.items) ? data.items : null;
  if (!items || items.length === 0) return fallback;
  return fallback.map((slot, index) => {
    const record = isRecord(items[index]) ? items[index] : {};
    return {
      ...slot,
      numeral: nonEmpty(text(record.numeral)) || slot.numeral,
      label: nonEmpty(text(record.label)) || slot.label,
    };
  });
}

function mergeServices(fallback: ServiceItem[], rows: ServiceRow[]): ServiceItem[] {
  if (rows.length === 0) return fallback;
  return rows.map((row, index) => {
    const slot = fallback[index];
    const src = row.storage_path
      ? imageUrl(row.storage_path)
      : imageUrl(null, row.external_url) || slot?.previewSrc || "";
    return {
      id: row.id,
      num: row.display_number || slot?.num || String(index + 1).padStart(2, "0"),
      title: row.title || slot?.title || "",
      subtitle: row.subtitle || slot?.subtitle || "",
      previewSrc: src,
      previewAlt: slot?.previewAlt || slot?.title || row.title,
    };
  });
}

function mergeGallery(fallback: GalleryImage[], rows: GalleryImageRow[]): GalleryImage[] {
  if (rows.length === 0) return fallback;
  const images: GalleryImage[] = [];
  for (const row of rows) {
    const src = row.storage_path
      ? imageUrl(row.storage_path)
      : imageUrl(null, row.external_url);
    if (!src) continue;
    images.push({
      id: row.id,
      src,
      alt: row.alt || "",
      caption: row.caption ?? undefined,
      location: row.location ?? undefined,
      year: row.year ?? undefined,
      focalPointX: row.focal_point_x,
      focalPointY: row.focal_point_y,
      order: row.sort_order,
      featured: row.featured,
    });
  }
  return images.length > 0 ? images : fallback;
}

function imageDraftFrom(
  fallbackAlt: string,
  data: Record<string, unknown> | undefined
): ContentImageDraft {
  return {
    image_path: nonEmpty(text(data?.image_path)) || null,
    image_alt: nonEmpty(text(data?.image_alt)) || fallbackAlt,
    image_width: num(data?.image_width),
    image_height: num(data?.image_height),
    focal_point_x: num(data?.focal_point_x) ?? 50,
    focal_point_y: num(data?.focal_point_y) ?? 50,
  };
}

function resolveImage<T extends ProjectImage>(
  fallback: T,
  data: Record<string, unknown> | undefined
): T {
  const alt = nonEmpty(text(data?.image_alt)) || fallback.alt;
  const path = text(data?.image_path)?.trim();
  if (!path) return { ...fallback, alt };

  const width = num(data?.image_width);
  const height = num(data?.image_height);
  return {
    ...fallback,
    src: imageUrl(path),
    alt,
    width: width ?? fallback.width,
    height: height ?? fallback.height,
    focalPointX: num(data?.focal_point_x) ?? 50,
    focalPointY: num(data?.focal_point_y) ?? 50,
  };
}

function frameRecord(value: unknown, index: number): Record<string, unknown> | undefined {
  if (!Array.isArray(value) || !isRecord(value[index])) return undefined;
  return value[index];
}

function overlayRecord(
  collage: Record<string, unknown> | undefined,
  index: number
): Record<string, unknown> | undefined {
  return frameRecord(collage?.overlays, index);
}

function pair(value: unknown): [string, string] | undefined {
  const list = stringList(value);
  if (!list || list.length < 2) return undefined;
  return [list[0], list[1]];
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
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

function setMeta(attr: "name" | "property", key: string, content: string): void {
  if (!content) return;
  const selector = `meta[${attr}="${key}"]`;
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}
