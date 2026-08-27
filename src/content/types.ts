/**
 * Content model for the NAHN photography portfolio.
 *
 * These types describe editable content only. Layout decisions — grid spans,
 * aspect ratios, reveal delays, stroke/fill treatments — deliberately stay in
 * the components, because the editorial composition is part of the approved
 * design rather than something an editor should change per image.
 *
 * Fields marked optional are placeholders for the future Supabase-backed admin
 * and are not consumed by the UI yet.
 */

export interface ProjectImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  /**
   * Focal point as a percentage, 0–100, mapping directly to CSS
   * `object-position: {focalPointX}% {focalPointY}%`. Defaults to centre (50/50)
   * when unset. Crops are never baked into image URLs.
   */
  focalPointX?: number;
  focalPointY?: number;
  order?: number;
  featured?: boolean;
  /** Index into `exifPresets`; selects the camera data revealed on hover. */
  exifIdx?: number;
}

export interface GalleryImage extends ProjectImage {
  location?: string;
  year?: string;
}

export interface PhotographyProject {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category?: string;
  year?: string;
  location?: string;
  description?: string;
  coverImage?: ProjectImage;
  images: ProjectImage[];
  published?: boolean;
  /** Sort position only. Changing it must never alter `displayNumber`. */
  order?: number;
  /** The label rendered in the UI, e.g. "01". Edited independently of `order`. */
  displayNumber?: string;
}

/**
 * Aerial / drone work. The approved design has no Flycam section yet, so no
 * Flycam content exists. The type is declared so a future section and the
 * admin can share the project shape without a second model.
 */
export type FlycamProject = PhotographyProject;

export interface CorporateProject {
  id: string;
  src: string;
  alt: string;
  category: string;
  client: string;
  year?: string;
  order?: number;
  published?: boolean;
  focalPointX?: number;
  focalPointY?: number;
}

export interface ExifPreset {
  camera: string;
  lens: string;
  exp: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  /** `tel:` target, which differs from the display format of `phone`. */
  phoneHref: string;
  location: string;
  instagramHandle?: string;
  instagramUrl?: string;
}

/** A full-width aerial plate with a place caption and optional GPS readout. */
export interface AerialImage extends ProjectImage {
  title: string;
  region: string;
  altitude: string;
  coordinates?: string;
}

/** A portrait aerial tile in the Flycam grid. */
export interface AerialFrame {
  id: string;
  src: string;
  loc: string;
  region: string;
  altitude: string;
}

export interface SiteSettings {
  name: string;
  tagline: string;
  year: string;
  nav: NavLink[];
  contact: ContactInfo;
}

export interface ServiceItem {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  previewSrc: string;
}

export interface StatItem {
  id: string;
  target: number;
  suffix: string;
  label: string;
}

export interface FilmStripFrame {
  id: string;
  /** Frame number printed on the contact sheet, e.g. "001". */
  n: string;
  src: string;
  loc: string;
  /** Portrait frames render narrower than landscape frames. */
  portrait: boolean;
}
