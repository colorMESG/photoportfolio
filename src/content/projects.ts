import type { FilmStripFrame, PhotographyProject, ProjectImage } from "./types";

export const selectedWorksHeading = {
  lines: ["TÁC PHẨM", "CHỌN LỌC."],
};

export const portraitStudy: PhotographyProject = {
  id: "portrait-study",
  slug: "nghien-cuu-chan-dung",
  title: "Nghiên cứu Chân dung",
  year: "2026",
  order: 1,
  displayNumber: "01",
  published: true,
  images: [
    {
      id: "p1a",
      src: "https://images.unsplash.com/photo-1772443325915-06ebf4d80fd3?w=700&h=1050&fit=crop&auto=format",
      alt: "Portrait study 01A",
      exifIdx: 0,
    },
    {
      id: "p1b",
      src: "https://images.unsplash.com/photo-1761014219776-4ac940eca1c2?w=500&h=700&fit=crop&auto=format",
      alt: "Portrait study 01B",
      exifIdx: 1,
    },
  ],
};

export const locationSeries: PhotographyProject = {
  id: "location-series",
  slug: "loat-anh-ngoai-canh",
  title: "Loạt ảnh Ngoại cảnh",
  year: "2025",
  order: 2,
  displayNumber: "02",
  published: true,
  images: [
    {
      id: "p2a",
      src: "https://images.unsplash.com/photo-1765021560210-5b0d950b45a9?w=1100&h=650&fit=crop&auto=format",
      alt: "Location 02A",
      exifIdx: 2,
    },
    {
      id: "p2b",
      src: "https://images.unsplash.com/photo-1578409682213-e27b3355cad7?w=420&h=600&fit=crop&auto=format",
      alt: "Location 02B",
      exifIdx: 3,
    },
  ],
};

/** Oversized ghost word set behind the location series. */
export const locationSeriesWord = "NGOẠI CẢNH";

export const contactSheet: PhotographyProject = {
  id: "contact-sheet",
  slug: "thuoc-phim-tiep-xuc",
  title: "Thước phim tiếp xúc",
  year: "2026",
  order: 3,
  displayNumber: "03",
  published: true,
  images: [
    {
      id: "p3a",
      src: "https://images.unsplash.com/photo-1768452570546-6f82796c240b?w=400&h=640&fit=crop&auto=format",
      alt: "Sheet 01",
      exifIdx: 0,
    },
    {
      id: "p3b",
      src: "https://images.unsplash.com/photo-1761014219855-4f598e712c26?w=400&h=640&fit=crop&auto=format",
      alt: "Sheet 02",
      exifIdx: 1,
    },
    {
      id: "p3c",
      src: "https://images.unsplash.com/photo-1765021561938-fad3f1122b14?w=400&h=640&fit=crop&auto=format",
      alt: "Sheet 03",
      exifIdx: 2,
    },
  ],
};

export const veilStudy: PhotographyProject = {
  id: "veil-study",
  slug: "nghien-cuu-man-che",
  title: "Nghiên cứu Màn che",
  year: "2026",
  order: 4,
  displayNumber: "04",
  published: true,
  images: [
    {
      id: "p4",
      src: "https://images.unsplash.com/photo-1591866605101-67aa6d498cce?w=1400&h=900&fit=crop&auto=format",
      alt: "Veil",
      exifIdx: 4,
    },
  ],
};

export const fragments: PhotographyProject = {
  id: "fragments",
  slug: "manh-ghep",
  title: "Mảnh ghép",
  year: "2025–2026",
  order: 5,
  displayNumber: "05",
  published: true,
  images: [
    {
      id: "p5a",
      src: "https://images.unsplash.com/photo-1674401770404-7d05485deb6a?w=650&h=850&fit=crop&auto=format",
      alt: "Fragments 05A",
      exifIdx: 0,
    },
    {
      id: "p5b",
      src: "https://images.unsplash.com/photo-1733561315077-3c7206344333?w=380&h=520&fit=crop&auto=format",
      alt: "Fragments 05B",
      exifIdx: 2,
    },
    {
      id: "p5c",
      src: "https://images.unsplash.com/photo-1576565315529-dd151aeebb8d?w=320&h=440&fit=crop&auto=format",
      alt: "Fragments 05C",
      exifIdx: 4,
    },
  ],
};

export const selectedWorks: PhotographyProject[] = [
  portraitStudy,
  locationSeries,
  contactSheet,
  veilStudy,
  fragments,
];

export const rosieProject: PhotographyProject = {
  id: "rosie",
  slug: "rosie",
  title: "ROSIE",
  subtitle: "Nghiên cứu Chân dung",
  location: "Tp. Hồ Chí Minh",
  year: "2026",
  order: 1,
  published: true,
  images: [
    {
      id: "r1",
      src: "https://images.unsplash.com/photo-1672039316587-0acb7676f754?w=1400&h=800&fit=crop&auto=format",
      alt: "Rosie full-width",
      exifIdx: 0,
    },
    {
      id: "r2",
      src: "https://images.unsplash.com/photo-1768017093116-42ee61fd5d2b?w=600&h=860&fit=crop&auto=format",
      alt: "Rosie 02",
      exifIdx: 1,
    },
    {
      id: "r3",
      src: "https://images.unsplash.com/photo-1674401770404-7d05485deb6a?w=600&h=860&fit=crop&auto=format",
      alt: "Rosie 03",
      exifIdx: 2,
    },
    {
      id: "r4a",
      src: "https://images.unsplash.com/photo-1576565315529-dd151aeebb8d?w=700&h=900&fit=crop&auto=format",
      alt: "Rosie pair 4",
      exifIdx: 3,
    },
    {
      id: "r4b",
      src: "https://images.unsplash.com/photo-1733561315077-3c7206344333?w=700&h=900&fit=crop&auto=format",
      alt: "Rosie pair 5",
      exifIdx: 4,
    },
    {
      id: "r5a",
      src: "https://images.unsplash.com/photo-1761014219776-4ac940eca1c2?w=360&h=540&fit=crop&auto=format",
      alt: "Rosie strip 1",
      exifIdx: 0,
    },
    {
      id: "r5b",
      src: "https://images.unsplash.com/photo-1761014219855-4f598e712c26?w=360&h=540&fit=crop&auto=format",
      alt: "Rosie strip 2",
      exifIdx: 1,
    },
    {
      id: "r5c",
      src: "https://images.unsplash.com/photo-1765021561938-fad3f1122b14?w=360&h=540&fit=crop&auto=format",
      alt: "Rosie strip 3",
      exifIdx: 2,
    },
    {
      id: "r6",
      src: "https://images.unsplash.com/photo-1591866605101-67aa6d498cce?w=1400&h=700&fit=crop&auto=format",
      alt: "Rosie cinematic",
      exifIdx: 5,
    },
  ],
};

/** Ghost numerals paired with time-of-day captions inside the Rosie story. */
export const rosieNumerals = [
  { id: "rosie-02", numeral: "02", label: "Ánh sáng buổi trưa" },
  { id: "rosie-03", numeral: "03", label: "Buổi chiều" },
];

export const collage = {
  background: {
    id: "cbg",
    src: "https://images.unsplash.com/photo-1764136454026-172c59780914?w=1400&h=900&fit=crop&auto=format",
    alt: "Collage bg",
    exifIdx: 2,
  } satisfies ProjectImage,
  overlays: [
    {
      id: "c1",
      src: "https://images.unsplash.com/photo-1688504087674-43c79cf49a84?w=260&h=360&fit=crop&auto=format",
      alt: "Overlay 01",
      exifIdx: 4,
    },
    {
      id: "c2",
      src: "https://images.unsplash.com/photo-1616472961382-13c212a1911b?w=240&h=320&fit=crop&auto=format",
      alt: "Overlay 02",
      exifIdx: 1,
    },
    {
      id: "c3",
      src: "https://images.unsplash.com/photo-1776236075200-7c9b1b2d327e?w=280&h=180&fit=crop&auto=format",
      alt: "Overlay 03",
      exifIdx: 3,
    },
  ] satisfies ProjectImage[],
  meta: ["Tháng 7, 2026", "Nghiên cứu Chân dung"],
  word: "EDITORIAL",
};

export const filmStripContent = {
  heading: "35mm",
  labels: ["Thước phim tiếp xúc", "NAHN · 2026 · Kéo để cuộn"],
  frames: [
    {
      id: "frame-001",
      n: "001",
      src: "https://images.unsplash.com/photo-1616472961382-13c212a1911b?w=260&h=390&fit=crop&auto=format",
      loc: "Tp. HCM",
      portrait: true,
    },
    {
      id: "frame-002",
      n: "002",
      src: "https://images.unsplash.com/photo-1776236075200-7c9b1b2d327e?w=400&h=260&fit=crop&auto=format",
      loc: "Hội An",
      portrait: false,
    },
    {
      id: "frame-003",
      n: "003",
      src: "https://images.unsplash.com/photo-1772443325915-06ebf4d80fd3?w=260&h=390&fit=crop&auto=format",
      loc: "Tp. HCM",
      portrait: true,
    },
    {
      id: "frame-004",
      n: "004",
      src: "https://images.unsplash.com/photo-1591866605101-67aa6d498cce?w=400&h=260&fit=crop&auto=format",
      loc: "Tp. HCM",
      portrait: false,
    },
    {
      id: "frame-005",
      n: "005",
      src: "https://images.unsplash.com/photo-1578409682213-e27b3355cad7?w=260&h=390&fit=crop&auto=format",
      loc: "Hội An",
      portrait: true,
    },
    {
      id: "frame-006",
      n: "006",
      src: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=260&fit=crop&auto=format",
      loc: "Hạ Long",
      portrait: false,
    },
    {
      id: "frame-007",
      n: "007",
      src: "https://images.unsplash.com/photo-1688504087674-43c79cf49a84?w=260&h=390&fit=crop&auto=format",
      loc: "Tp. HCM",
      portrait: true,
    },
    {
      id: "frame-008",
      n: "008",
      src: "https://images.unsplash.com/photo-1740232187966-a42e7e4d1e76?w=400&h=260&fit=crop&auto=format",
      loc: "Hà Nội",
      portrait: false,
    },
    {
      id: "frame-009",
      n: "009",
      src: "https://images.unsplash.com/photo-1765021561938-fad3f1122b14?w=260&h=390&fit=crop&auto=format",
      loc: "Tp. HCM",
      portrait: true,
    },
    {
      id: "frame-010",
      n: "010",
      src: "https://images.unsplash.com/photo-1687902409602-8b7cf039a44a?w=400&h=260&fit=crop&auto=format",
      loc: "Tp. HCM",
      portrait: false,
    },
  ] satisfies FilmStripFrame[],
};
