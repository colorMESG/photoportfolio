/**
 * The photographs the public site currently renders, keyed by the same slugs
 * as the seeded `projects` rows.
 *
 * This is a reference for the admin, not a migration. Nothing here is written
 * to Supabase. When a published project has managed photographs, the public
 * site renders that set only — these Unsplash plates stay in `src/content/`
 * as fallback and are not mixed in.
 */

import { events, headshots, teams } from "../../content/corporate";
import {
  aerialFrames,
  flyBaiTuLong,
  flyHaLong,
  flyMuCangChai,
  flySaPa,
} from "../../content/flycam";
import { personalGallery } from "../../content/gallery";
import { collage, filmStripContent, rosieProject, selectedWorks } from "../../content/projects";
import type { CorporateCategory, ProjectKind } from "../db/types";

export interface StaticPhoto {
  id: string;
  src: string;
  alt: string;
  /** Public name / client / place currently rendered for this slot. */
  displayTitle?: string;
  /** Public role / category / region currently rendered for this slot. */
  displaySubtitle?: string;
  displayYear?: string;
  displayLabel?: string;
}

export interface StaticProjectRef {
  slug: string;
  kind: ProjectKind;
  title: string;
  images: StaticPhoto[];
  subtitle?: string;
  year?: string;
  location?: string;
  displayNumber?: string;
  category?: string;
  client?: string;
  corporateCategory?: CorporateCategory;
  coordinates?: string;
  altitude?: string;
}

function photosFromProject(
  slug: string,
  kind: ProjectKind,
  title: string,
  images: Array<{
    id: string;
    src: string;
    alt: string;
    client?: string;
    category?: string;
    year?: string;
    title?: string;
    region?: string;
    altitude?: string;
    location?: string;
    caption?: string;
    coordinates?: string;
  }>,
  meta: Partial<StaticProjectRef> = {}
): StaticProjectRef {
  return {
    slug,
    kind,
    title,
    subtitle: meta.subtitle,
    year: meta.year ?? images[0]?.year,
    location: meta.location ?? images[0]?.region ?? images[0]?.location,
    displayNumber: meta.displayNumber,
    category: meta.category ?? images[0]?.category,
    client: meta.client ?? images[0]?.client,
    corporateCategory: meta.corporateCategory,
    coordinates: meta.coordinates ?? images[0]?.coordinates,
    altitude: meta.altitude ?? images[0]?.altitude,
    images: images.map((image) => ({
      id: image.id,
      src: image.src,
      alt: image.alt,
      displayTitle: image.client ?? image.title ?? image.location,
      displaySubtitle: image.category ?? image.region,
      displayYear: image.year,
      displayLabel: image.altitude,
    })),
  };
}

const photography: StaticProjectRef[] = [
  ...selectedWorks.map((project) =>
    photosFromProject(project.slug, "photography", project.title, project.images, {
      subtitle: project.subtitle,
      year: project.year,
      location: project.location,
      displayNumber: project.displayNumber,
      category: project.category,
    })
  ),
  photosFromProject(rosieProject.slug, "photography", rosieProject.title, rosieProject.images, {
    subtitle: rosieProject.subtitle,
    year: rosieProject.year,
    location: rosieProject.location,
  }),
];

const flycam: StaticProjectRef[] = [
  photosFromProject("vinh-ha-long", "flycam", flyHaLong.title, [flyHaLong], {
    location: flyHaLong.region,
    altitude: flyHaLong.altitude,
    coordinates: flyHaLong.coordinates,
  }),
  photosFromProject("thung-lung-sa-pa", "flycam", flySaPa.title, [flySaPa], {
    location: flySaPa.region,
    altitude: flySaPa.altitude,
    coordinates: flySaPa.coordinates,
  }),
  photosFromProject("mu-cang-chai", "flycam", flyMuCangChai.title, [flyMuCangChai], {
    location: flyMuCangChai.region,
    altitude: flyMuCangChai.altitude,
  }),
  photosFromProject("vinh-bai-tu-long", "flycam", flyBaiTuLong.title, [flyBaiTuLong], {
    location: flyBaiTuLong.region,
    altitude: flyBaiTuLong.altitude,
  }),
];

const corporate: StaticProjectRef[] = [
  photosFromProject(
    "chan-dung-headshot",
    "corporate",
    "Chân dung Cá nhân & Headshot",
    headshots,
    { corporateCategory: "headshot", year: headshots[0]?.year }
  ),
  ...events.map((event) =>
    photosFromProject(slugFromTitle(event.client), "corporate", event.client, [event], {
      corporateCategory: "event",
      client: event.client,
      category: event.category,
      year: event.year,
    })
  ),
  photosFromProject("startup-hcm", "corporate", teams[0].client, [teams[0]], {
    corporateCategory: "team",
    client: teams[0].client,
    category: teams[0].category,
    year: teams[0].year,
  }),
  photosFromProject("doanh-nghiep-hcm", "corporate", teams[1].client, [teams[1]], {
    corporateCategory: "team",
    client: teams[1].client,
    category: teams[1].category,
    year: teams[1].year,
  }),
  photosFromProject("creative-agency", "corporate", teams[2].client, [teams[2]], {
    corporateCategory: "team",
    client: teams[2].client,
    category: teams[2].category,
    year: teams[2].year,
  }),
  photosFromProject("teambuilding-2025", "corporate", teams[3].client, [teams[3]], {
    corporateCategory: "team",
    client: teams[3].client,
    category: teams[3].category,
    year: teams[3].year,
  }),
];

function slugFromTitle(title: string): string {
  const map: Record<string, string> = {
    "TechSummit Vietnam 2026": "techsummit-vietnam-2026",
    "Gala Thường Niên 2026": "gala-thuong-nien-2026",
    "Giải thưởng Xuất sắc": "giai-thuong-xuat-sac",
    "Đêm Kết Nối": "dem-ket-noi",
    "Giải thưởng Đổi mới": "giai-thuong-doi-moi",
  };
  return map[title] ?? title;
}

const byKey = new Map<string, StaticProjectRef>();
for (const project of [...photography, ...flycam, ...corporate]) {
  byKey.set(`${project.kind}:${project.slug}`, project);
}

export function staticProject(kind: ProjectKind, slug: string): StaticProjectRef | null {
  return byKey.get(`${kind}:${slug}`) ?? null;
}

export function staticProjects(kind: ProjectKind): StaticProjectRef[] {
  if (kind === "photography") return photography;
  if (kind === "flycam") return flycam;
  return corporate;
}

export function staticCover(kind: ProjectKind, slug: string): StaticPhoto | null {
  return staticProject(kind, slug)?.images[0] ?? null;
}

/** Photographs composed on the public site that are not a seeded project. */
export const extraPublicPhotographs = {
  flycamFrames: aerialFrames.map((frame) => ({
    id: frame.id,
    src: frame.src,
    alt: frame.loc,
    label: `${frame.loc} · ${frame.region}`,
  })),
  collage: [collage.background, ...collage.overlays].map((image) => ({
    id: image.id,
    src: image.src,
    alt: image.alt,
  })),
  filmStrip: filmStripContent.frames.map((frame) => ({
    id: frame.id,
    src: frame.src,
    alt: `${frame.n} · ${frame.loc}`,
  })),
};

export const staticGalleryPhotos: StaticPhoto[] = personalGallery.map((image) => ({
  id: image.id,
  src: image.src,
  alt: image.alt,
  displayTitle: image.location,
  displayYear: image.year,
  displayLabel: image.caption,
}));
