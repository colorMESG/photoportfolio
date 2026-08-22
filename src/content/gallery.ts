import type { GalleryImage } from "./types";

export const galleryHeading = {
  lines: ["BỘ SƯU TẬP", "CÁ NHÂN."],
};

export const hoiAn: GalleryImage = {
  id: "g1",
  src: "https://images.unsplash.com/photo-1761150285751-c593ab20159c?w=600&h=800&fit=crop&auto=format",
  alt: "Hội An",
  location: "Hội An",
  year: "2026",
  exifIdx: 0,
};

export const saPa: GalleryImage = {
  id: "g3",
  src: "https://images.unsplash.com/photo-1585970661791-9cec67470281?w=700&h=480&fit=crop&auto=format",
  alt: "Sa Pa",
  location: "Sa Pa",
  year: "2025",
  exifIdx: 3,
};

export const haLong: GalleryImage = {
  id: "g4",
  src: "https://images.unsplash.com/photo-1528127269322-539801943592?w=700&h=480&fit=crop&auto=format",
  alt: "Hạ Long",
  location: "Vịnh Hạ Long",
  year: "2025",
  exifIdx: 2,
};

export const phuQuoc: GalleryImage = {
  id: "g2",
  src: "https://images.unsplash.com/photo-1574699404005-b6120622b1e7?w=500&h=700&fit=crop&auto=format",
  alt: "Biển đảo",
  location: "Phú Quốc",
  year: "2026",
  exifIdx: 1,
};

export const saigonNight: GalleryImage = {
  id: "g5",
  src: "https://images.unsplash.com/photo-1687902409602-8b7cf039a44a?w=500&h=640&fit=crop&auto=format",
  alt: "Phố ăn đêm",
  location: "Tp. Hồ Chí Minh",
  year: "2026",
  exifIdx: 4,
};

export const hoiAnOldTown: GalleryImage = {
  id: "g6",
  src: "https://images.unsplash.com/photo-1776236075314-f5de886f8d2c?w=640&h=420&fit=crop&auto=format",
  alt: "Phố cổ Hội An",
  location: "Phố cổ Hội An",
  year: "2025",
  exifIdx: 5,
};

/** DOM order matches the editorial composition in PersonalGallery. */
export const personalGallery: GalleryImage[] = [
  hoiAn,
  saPa,
  haLong,
  phuQuoc,
  saigonNight,
  hoiAnOldTown,
];
