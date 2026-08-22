import type { AerialFrame, AerialImage } from "./types";

export const flycamHeading = {
  eyebrow: "Nhìn từ trên cao",
  lines: ["FLYCAM", "AERIAL."],
  description:
    "Góc nhìn từ flycam mang lại chiều sâu mới — từ ruộng bậc thang, vịnh biển đến sự kiện ngoài trời. Độ phân giải 4K, chứng chỉ bay hợp lệ.",
};

export const flyHaLong: AerialImage = {
  id: "fly1",
  src: "https://images.unsplash.com/photo-1668000018482-a02acf02b22a?w=1400&h=700&fit=crop&auto=format",
  alt: "Vịnh Hạ Long từ trên cao",
  title: "Vịnh Hạ Long",
  region: "Quảng Ninh",
  altitude: "150m",
  coordinates: "20°54'N · 107°05'E",
};

export const flySaPa: AerialImage = {
  id: "fly2",
  src: "https://images.unsplash.com/photo-1697015556424-756b0f152f0c?w=1400&h=700&fit=crop&auto=format",
  alt: "Thung lũng Sa Pa",
  title: "Thung lũng Sa Pa",
  region: "Lào Cai",
  altitude: "180m",
  coordinates: "22°20'N · 103°50'E",
};

export const flyMuCangChai: AerialImage = {
  id: "fly7",
  src: "https://images.unsplash.com/photo-1779185249766-70c079a11f4f?w=1400&h=700&fit=crop&auto=format",
  alt: "Ruộng bậc thang Mù Cang Chải",
  title: "Mù Cang Chải",
  region: "Yên Bái",
  altitude: "100m",
};

export const flyBaiTuLong: AerialImage = {
  id: "fly8",
  src: "https://images.unsplash.com/photo-1772717083265-2d93b89f0b7f?w=1400&h=700&fit=crop&auto=format",
  alt: "Vịnh đá vôi",
  title: "Vịnh Bái Tử Long",
  region: "Quảng Ninh",
  altitude: "130m",
};

/** Ghost word overlaid on the Mù Cang Chải panoramic. */
export const flycamOverlayWord = "TỪ TRÊN CAO.";

export const aerialFrames: AerialFrame[] = [
  {
    id: "fly3",
    src: "https://images.unsplash.com/photo-1695094412603-3340f1e72232?w=500&h=750&fit=crop&auto=format",
    loc: "Thung lũng sông",
    region: "Hà Giang",
    altitude: "120m",
  },
  {
    id: "fly4",
    src: "https://images.unsplash.com/photo-1787173824957-9b6cc293494a?w=900&h=500&fit=crop&auto=format",
    loc: "Sa Pa nhìn từ trên",
    region: "Lào Cai",
    altitude: "200m",
  },
  {
    id: "fly5",
    src: "https://images.unsplash.com/photo-1697015556006-9e767c7187dc?w=500&h=750&fit=crop&auto=format",
    loc: "Khúc quanh sông",
    region: "Hà Giang",
    altitude: "95m",
  },
  {
    id: "fly6",
    src: "https://images.unsplash.com/photo-1743485754031-a674557a83cf?w=500&h=750&fit=crop&auto=format",
    loc: "Ruộng bậc thang",
    region: "Mù Cang Chải",
    altitude: "110m",
  },
];

export const flycamCapabilities = [
  { id: "resolution", label: "Độ phân giải", val: "4K / 12MP RAW" },
  { id: "altitude", label: "Độ cao bay", val: "Tối đa 400m" },
  { id: "terrain", label: "Địa hình", val: "Nội địa · Biển đảo" },
  { id: "licence", label: "Chứng chỉ", val: "Bay hợp pháp" },
];
