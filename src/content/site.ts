import { eventPanel, headshot02, headshot05, teamDiverse } from "./corporate";
import { flyHaLong } from "./flycam";
import { locationSeries, portraitStudy } from "./projects";
import type { ContactInfo, ExifPreset, ProjectImage, ServiceItem, SiteSettings } from "./types";

export const uiLabels = {
  lightboxClose: "ESC / ĐÓNG",
};

export const contactInfo: ContactInfo = {
  email: "hello@nahn.photo",
  phone: "0901 234 567",
  phoneHref: "tel:+84901234567",
  location: "Thành phố Hồ Chí Minh",
};

export const siteSettings: SiteSettings = {
  name: "NAHN",
  tagline: "Nhiếp ảnh",
  year: "2026",
  nav: [
    { label: "Tác phẩm", href: "#work" },
    { label: "Flycam", href: "#flycam" },
    { label: "Doanh nghiệp", href: "#business" },
    { label: "Về tôi", href: "#about" },
    { label: "Liên hệ", href: "#contact" },
  ],
  contact: contactInfo,
};

/** Camera data revealed when hovering a photo; referenced by `exifIdx`. */
export const exifPresets: ExifPreset[] = [
  { camera: "NIKON Z9", lens: "85mm f/1.4G", exp: "f/1.4 · 1/640s · ISO 400" },
  { camera: "SONY A7R V", lens: "50mm f/1.2 GM", exp: "f/1.2 · 1/500s · ISO 200" },
  { camera: "CANON EOS R5", lens: "135mm f/1.8L", exp: "f/1.8 · 1/320s · ISO 800" },
  { camera: "LEICA M11", lens: "35mm f/1.4 ASPH", exp: "f/2.0 · 1/250s · ISO 640" },
  { camera: "FUJI X-T5", lens: "56mm f/1.2 R", exp: "f/1.2 · 1/800s · ISO 160" },
  { camera: "NIKON Z9", lens: "70–200mm f/2.8", exp: "f/2.8 · 1/1000s · ISO 320" },
];

export const heroContent = {
  words: ["NAHN", "PHOTO", "GRAPHY."],
  image: {
    id: "hero",
    src: "https://images.unsplash.com/photo-1760341682460-ca6f13eb035a?w=1400&h=2000&fit=crop&auto=format",
    alt: "Portrait by NAHN",
  } satisfies ProjectImage,
  meta: ["Hồ sơ Nhiếp ảnh", "2026", "Thành phố Hồ Chí Minh"],
  scrollLabel: "Cuộn xuống",
};

export const marqueeItems = [
  "Chân dung Doanh nghiệp",
  "Headshot",
  "Nhiếp ảnh Sự kiện",
  "Flycam & Aerial",
  "Ảnh Nhân sự",
  "Chiến dịch Thương hiệu",
  "Nhiếp ảnh Hội nghị",
  "Ra mắt Sản phẩm",
  "Ảnh Đội nhóm",
  "Phong cảnh từ trên cao",
];

export const statementContent = {
  lines: [
    "TÔI CHỤP",
    "CON NGƯỜI,",
    "NƠI CHỐN,",
    "ÁNH SÁNG,",
    "VÀ",
    "MỌI THỨ",
    "Ở GIỮA.",
  ],
  paragraph:
    "Tôi quan tâm đến những khoảnh khắc giữa các tư thế — biểu cảm, ánh sáng, chuyển động và những chi tiết khiến một bức ảnh trở nên cá nhân.",
};

export const servicesContent = {
  eyebrow: "Dịch vụ cung cấp",
  heading: "DỊCH VỤ.",
  items: [
    {
      id: "corporate-portrait",
      num: "01",
      title: "Chân dung Doanh nghiệp",
      subtitle: "Chân dung cá nhân & lãnh đạo",
      previewSrc: headshot05.src,
    },
    {
      id: "events",
      num: "02",
      title: "Sự kiện & Hội nghị",
      subtitle: "Hội nghị, gala, lễ trao giải",
      previewSrc: eventPanel.src,
    },
    {
      id: "team",
      num: "03",
      title: "Ảnh Nhân sự & Đội nhóm",
      subtitle: "Ảnh nhóm & nhân viên công ty",
      previewSrc: teamDiverse.src,
    },
    {
      id: "flycam",
      num: "04",
      title: "Flycam & Aerial",
      subtitle: "Phong cảnh, sự kiện từ trên cao",
      previewSrc: flyHaLong.src,
    },
    {
      id: "headshot-package",
      num: "05",
      title: "Gói Headshot",
      subtitle: "Chụp nhanh cho doanh nghiệp",
      previewSrc: headshot02.src,
    },
    {
      id: "brand-campaign",
      num: "06",
      title: "Chiến dịch Thương hiệu",
      subtitle: "Ảnh thương hiệu & sản phẩm",
      previewSrc: locationSeries.images[0].src,
    },
    {
      id: "editorial",
      num: "07",
      title: "Editorial & Thời trang",
      subtitle: "Lookbook, tạp chí, nghệ thuật",
      previewSrc: portraitStudy.images[0].src,
    },
  ] satisfies ServiceItem[],
};

export const aboutContent = {
  image: {
    id: "about",
    src: "https://images.unsplash.com/photo-1578409682213-e27b3355cad7?w=700&h=950&fit=crop&auto=format",
    alt: "NAHN portrait",
    exifIdx: 3,
  } satisfies ProjectImage,
  headings: ["XIN CHÀO,", "TÔI LÀ NAHN."],
  paragraphs: [
    "Nhiếp ảnh gia tại Thành phố Hồ Chí Minh.",
    "Tôi quan tâm đến con người, ánh sáng, du lịch và những khoảnh khắc thường ngày. Sẵn sàng nhận dự án editorial, thương mại và doanh nghiệp.",
  ],
  details: [contactInfo.email, contactInfo.phone, "Thành phố Hồ Chí Minh, Việt Nam"],
};

export const contactContent = {
  words: ["HÃY", "CÙNG", "TẠO RA", "ĐIỀU GÌ ĐÓ."],
  links: [
    { label: "Email", val: contactInfo.email, href: `mailto:${contactInfo.email}` },
    { label: "Điện thoại", val: contactInfo.phone, href: contactInfo.phoneHref },
  ],
  addressLabel: "Địa chỉ",
  address: contactInfo.location,
  image: {
    id: "contact",
    src: "https://images.unsplash.com/photo-1768017093116-42ee61fd5d2b?w=900&h=1100&fit=crop&auto=format",
    alt: "Contact portrait",
    exifIdx: 0,
  } satisfies ProjectImage,
};

export const footerContent = {
  tagline: "Nhiếp ảnh · Tp. Hồ Chí Minh",
  links: [
    { label: "Email", href: `mailto:${contactInfo.email}` },
    { label: contactInfo.phone, href: contactInfo.phoneHref },
  ],
  backToTop: "Về đầu trang ↑",
  copyright: "NAHN © 2026",
};
