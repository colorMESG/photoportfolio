import type { CorporateProject, StatItem } from "./types";

export const corporateHeading = {
  eyebrow: "Dành cho Doanh nghiệp",
  lines: ["DOANH NGHIỆP", "& SỰ KIỆN."],
  description:
    "Ảnh chân dung doanh nghiệp, sự kiện và nhân sự — được thực hiện với sự chỉn chu và nhất quán như mọi bộ ảnh editorial.",
};

export const headshotsLabel = "Chân dung Cá nhân & Headshot";
export const eventsLabel = "Nhiếp ảnh Sự kiện & Hội nghị";
export const teamsLabel = "Nhiếp ảnh Nhân sự & Đội nhóm";

/** Ghost word set behind the events grid. */
export const eventsWord = "SỰ KIỆN.";

export const headshot01: CorporateProject = {
  id: "h1",
  src: "https://images.unsplash.com/photo-1665224752561-85f4da9a5658?w=500&h=700&fit=crop&auto=format",
  alt: "Headshot 01",
  category: "Headshot",
  client: "Nguyen Van A",
  year: "2026",
};

export const headshot02: CorporateProject = {
  id: "h2",
  src: "https://images.unsplash.com/photo-1616639943825-e0fbad20a3d3?w=500&h=700&fit=crop&auto=format",
  alt: "Headshot 02",
  category: "Chân dung",
  client: "Tran Thi B",
  year: "2026",
};

export const headshot05: CorporateProject = {
  id: "h5",
  src: "https://images.unsplash.com/photo-1665224751641-8ea911ca2267?w=500&h=700&fit=crop&auto=format",
  alt: "Headshot 05",
  category: "Chân dung",
  client: "Hoang Van E",
  year: "2026",
};

export const headshots: CorporateProject[] = [
  headshot01,
  headshot02,
  {
    id: "h3",
    src: "https://images.unsplash.com/photo-1665224752136-4dbe2dfc8195?w=500&h=700&fit=crop&auto=format",
    alt: "Headshot 03",
    category: "Headshot",
    client: "Le Thi C",
    year: "2026",
  },
  {
    id: "h4",
    src: "https://images.unsplash.com/photo-1665224752123-a2ea29dddcb2?w=500&h=700&fit=crop&auto=format",
    alt: "Headshot 04",
    category: "Lãnh đạo",
    client: "Pham Thi D",
    year: "2026",
  },
  headshot05,
  {
    id: "h6",
    src: "https://images.unsplash.com/photo-1697288454587-14d38111df00?w=500&h=700&fit=crop&auto=format",
    alt: "Headshot 06",
    category: "Lãnh đạo",
    client: "Nguyen Thi F",
    year: "2026",
  },
];

export const eventPanel: CorporateProject = {
  id: "e1",
  src: "https://images.unsplash.com/photo-1756806481210-672c297558e7?w=900&h=600&fit=crop&auto=format",
  alt: "Panel discussion",
  category: "Hội nghị",
  client: "TechSummit Vietnam 2026",
  year: "2026",
};

export const eventGala: CorporateProject = {
  id: "e2",
  src: "https://images.unsplash.com/photo-1756806481200-4c35450e87e4?w=900&h=600&fit=crop&auto=format",
  alt: "Event lights",
  category: "Gala",
  client: "Gala Thường Niên 2026",
  year: "2026",
};

export const eventAward: CorporateProject = {
  id: "e3",
  src: "https://images.unsplash.com/photo-1529739195191-4246f11b3382?w=500&h=700&fit=crop&auto=format",
  alt: "Award ceremony",
  category: "Trao giải",
  client: "Giải thưởng Xuất sắc",
  year: "2026",
};

export const eventNetworking: CorporateProject = {
  id: "e4",
  src: "https://images.unsplash.com/photo-1650732325541-8de724c00601?w=900&h=600&fit=crop&auto=format",
  alt: "Networking",
  category: "Sự kiện",
  client: "Đêm Kết Nối",
  year: "2026",
};

export const eventStage: CorporateProject = {
  id: "e5",
  src: "https://images.unsplash.com/photo-1743128105803-961ff400c83e?w=900&h=600&fit=crop&auto=format",
  alt: "Award on stage",
  category: "Trao giải",
  client: "Giải thưởng Đổi mới",
  year: "2026",
};

export const events: CorporateProject[] = [
  eventPanel,
  eventGala,
  eventAward,
  eventNetworking,
  eventStage,
];

export const teamDiverse: CorporateProject = {
  id: "t1",
  src: "https://images.unsplash.com/photo-1529739195191-4246f11b3382?w=900&h=500&fit=crop&auto=format",
  alt: "Diverse team",
  category: "Nhân sự",
  client: "Startup · Tp. Hồ Chí Minh",
  year: "2026",
};

export const teamBusiness: CorporateProject = {
  id: "t2",
  src: "https://images.unsplash.com/photo-1756806481210-672c297558e7?w=900&h=500&fit=crop&auto=format",
  alt: "Business team",
  category: "Nhân sự",
  client: "Doanh nghiệp · Tp. Hồ Chí Minh",
  year: "2026",
};

export const teamOverhead: CorporateProject = {
  id: "t3",
  src: "https://images.unsplash.com/photo-1650732325522-6f758102e71a?w=900&h=500&fit=crop&auto=format",
  alt: "Team overhead",
  category: "Ảnh trên cao",
  client: "Creative Agency",
  year: "2026",
};

export const teamOutdoor: CorporateProject = {
  id: "t4",
  src: "https://images.unsplash.com/photo-1776236075200-7c9b1b2d327e?w=900&h=600&fit=crop&auto=format",
  alt: "Team outdoor",
  category: "Outing",
  client: "Teambuilding Cuối Năm 2025",
  year: "2026",
};

export const teams: CorporateProject[] = [
  teamDiverse,
  teamBusiness,
  teamOverhead,
  teamOutdoor,
];

export const retouchContent = {
  label: "Chỉnh sửa Headshot",
  image: {
    src: headshot01.src,
    alt: "Corporate headshot before and after",
  },
  beforeLabel: "Trước",
  afterLabel: "Sau",
  dragHint: "Kéo để so sánh",
  statsWord: "CON SỐ.",
  stats: [
    { id: "events", target: 120, suffix: "+", label: "Sự kiện đã chụp" },
    { id: "clients", target: 45, suffix: "+", label: "Doanh nghiệp đã phục vụ" },
    { id: "portraits", target: 800, suffix: "+", label: "Chân dung đã thực hiện" },
    { id: "years", target: 6, suffix: "", label: "Năm kinh nghiệm" },
  ] satisfies StatItem[],
  note: "Từ startup đến tập đoàn lớn — mỗi dự án đều được thực hiện với sự chỉn chu và phong cách nhất quán.",
};
