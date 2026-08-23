/**
 * The photographs the public site currently renders, keyed by the same slugs
 * as the seeded `projects` rows.
 *
 * This is a reference for the admin, not a migration. Nothing here is written
 * to Supabase — the Unsplash placeholders stay in `src/content/` until they
 * are replaced by real uploads.
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
import type { ProjectKind } from "../db/types";

export interface StaticPhoto {
  id: string;
  src: string;
  alt: string;
}

export interface StaticProjectRef {
  slug: string;
  kind: ProjectKind;
  title: string;
  images: StaticPhoto[];
}

function photosFromProject(
  slug: string,
  kind: ProjectKind,
  title: string,
  images: { id: string; src: string; alt: string }[]
): StaticProjectRef {
  return { slug, kind, title, images: images.map(({ id, src, alt }) => ({ id, src, alt })) };
}

const photography: StaticProjectRef[] = [
  ...selectedWorks.map((project) =>
    photosFromProject(project.slug, "photography", project.title, project.images)
  ),
  photosFromProject(rosieProject.slug, "photography", rosieProject.title, rosieProject.images),
];

const flycam: StaticProjectRef[] = [
  photosFromProject("vinh-ha-long", "flycam", flyHaLong.title, [flyHaLong]),
  photosFromProject("thung-lung-sa-pa", "flycam", flySaPa.title, [flySaPa]),
  photosFromProject("mu-cang-chai", "flycam", flyMuCangChai.title, [flyMuCangChai]),
  photosFromProject("vinh-bai-tu-long", "flycam", flyBaiTuLong.title, [flyBaiTuLong]),
];

const corporate: StaticProjectRef[] = [
  photosFromProject(
    "chan-dung-headshot",
    "corporate",
    "Chân dung Cá nhân & Headshot",
    headshots
  ),
  ...events.map((event) =>
    photosFromProject(slugFromTitle(event.client), "corporate", event.client, [event])
  ),
  photosFromProject("startup-hcm", "corporate", teams[0].client, [teams[0]]),
  photosFromProject("doanh-nghiep-hcm", "corporate", teams[1].client, [teams[1]]),
  photosFromProject("creative-agency", "corporate", teams[2].client, [teams[2]]),
  photosFromProject("teambuilding-2025", "corporate", teams[3].client, [teams[3]]),
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
  // location/year stay on the public image; the admin only needs a recognizable plate.
}));
