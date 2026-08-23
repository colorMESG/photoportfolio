-- =============================================================================
-- 0001_content.sql — seed the text content from src/content/*.ts
--
-- Run in the SQL Editor after the migrations. Safe to run more than once: every
-- statement is ON CONFLICT DO NOTHING / guarded, so it never overwrites edits
-- made later through the admin.
--
-- Deliberately seeds NO images. Every photograph currently on the site is an
-- Unsplash placeholder with the crop baked into its URL, which is the opposite
-- of the storage_path + focal-point model. Real photography is uploaded through
-- the admin, and the static files in src/content/ keep the public site rendering
-- until then.
--
-- jsonb is dollar-quoted ($json$…$json$) so Vietnamese text and apostrophes need
-- no escaping.
-- =============================================================================


-- ── site identity, contact and SEO ─────────────────────────────────────────

insert into public.site_settings (
  id, brand_name, subtitle, email, phone, phone_href, location,
  seo_title, seo_description
) values (
  true,
  'NAHN',
  'Nhiếp ảnh',
  'hello@nahn.photo',
  '0901 234 567',
  'tel:+84901234567',
  'Thành phố Hồ Chí Minh',
  'NAHN — Nhiếp ảnh',
  'Nhiếp ảnh gia tại Thành phố Hồ Chí Minh. Chân dung, editorial, sự kiện doanh nghiệp và flycam.'
)
on conflict (id) do nothing;


-- ── editorial photography projects ─────────────────────────────────────────
-- sort_order and display_number are set independently, exactly as the site
-- renders them today.

insert into public.projects
  (kind, slug, title, subtitle, location, year, display_number, sort_order, published)
values
  ('photography', 'nghien-cuu-chan-dung', 'Nghiên cứu Chân dung', null, null, '2026',      '01', 1, true),
  ('photography', 'loat-anh-ngoai-canh',  'Loạt ảnh Ngoại cảnh',  null, null, '2025',      '02', 2, true),
  ('photography', 'thuoc-phim-tiep-xuc',  'Thước phim tiếp xúc',  null, null, '2026',      '03', 3, true),
  ('photography', 'nghien-cuu-man-che',   'Nghiên cứu Màn che',   null, null, '2026',      '04', 4, true),
  ('photography', 'manh-ghep',            'Mảnh ghép',            null, null, '2025–2026', '05', 5, true),
  -- The Rosie story labels its sections with its own numerals, so it carries no
  -- display_number of its own.
  ('photography', 'rosie', 'ROSIE', 'Nghiên cứu Chân dung', 'Tp. Hồ Chí Minh', '2026', null, 6, true)
on conflict (kind, slug) do nothing;


-- ── flycam / aerial ────────────────────────────────────────────────────────
-- `region` becomes `location`; altitude and coordinates have dedicated columns.

insert into public.projects
  (kind, slug, title, location, altitude, coordinates, year, sort_order, published)
values
  ('flycam', 'vinh-ha-long',    'Vịnh Hạ Long',      'Quảng Ninh', '150m', '20°54''N · 107°05''E', '2026', 1, true),
  ('flycam', 'thung-lung-sa-pa','Thung lũng Sa Pa',  'Lào Cai',    '180m', '22°20''N · 103°50''E', '2026', 2, true),
  ('flycam', 'mu-cang-chai',    'Mù Cang Chải',      'Yên Bái',    '100m', null,                   '2026', 3, true),
  ('flycam', 'vinh-bai-tu-long','Vịnh Bái Tử Long',  'Quảng Ninh', '130m', null,                   '2026', 4, true)
on conflict (kind, slug) do nothing;


-- ── corporate ──────────────────────────────────────────────────────────────
-- Headshots are one project whose sitters become individual photographs. Events
-- and team shoots are one project per engagement, which is what preserves the
-- client names as real content rather than throwing them away.

insert into public.projects
  (kind, slug, title, corporate_category, client, year, sort_order, published)
values
  ('corporate', 'chan-dung-headshot', 'Chân dung Cá nhân & Headshot', 'headshot', null, '2026', 1, true),

  ('corporate', 'techsummit-vietnam-2026', 'TechSummit Vietnam 2026', 'event', 'TechSummit Vietnam 2026', '2026', 2, true),
  ('corporate', 'gala-thuong-nien-2026',   'Gala Thường Niên 2026',   'event', 'Gala Thường Niên 2026',   '2026', 3, true),
  ('corporate', 'giai-thuong-xuat-sac',    'Giải thưởng Xuất sắc',    'event', 'Giải thưởng Xuất sắc',    '2026', 4, true),
  ('corporate', 'dem-ket-noi',             'Đêm Kết Nối',             'event', 'Đêm Kết Nối',             '2026', 5, true),
  ('corporate', 'giai-thuong-doi-moi',     'Giải thưởng Đổi mới',     'event', 'Giải thưởng Đổi mới',     '2026', 6, true),

  ('corporate', 'startup-hcm',             'Startup · Tp. Hồ Chí Minh',    'team', 'Startup · Tp. Hồ Chí Minh',    '2026', 7, true),
  ('corporate', 'doanh-nghiep-hcm',        'Doanh nghiệp · Tp. Hồ Chí Minh','team', 'Doanh nghiệp · Tp. Hồ Chí Minh','2026', 8, true),
  ('corporate', 'creative-agency',         'Creative Agency',              'team', 'Creative Agency',              '2026', 9, true),
  ('corporate', 'teambuilding-2025',       'Teambuilding Cuối Năm 2025',   'team', 'Teambuilding Cuối Năm 2025',   '2026', 10, true)
on conflict (kind, slug) do nothing;


-- ── services ───────────────────────────────────────────────────────────────
-- Guarded on the table being empty so a re-run cannot duplicate the list.

insert into public.services (display_number, title, subtitle, sort_order, published)
select * from (values
  ('01', 'Chân dung Doanh nghiệp',  'Chân dung cá nhân & lãnh đạo',   1, true),
  ('02', 'Sự kiện & Hội nghị',      'Hội nghị, gala, lễ trao giải',   2, true),
  ('03', 'Ảnh Nhân sự & Đội nhóm',  'Ảnh nhóm & nhân viên công ty',   3, true),
  ('04', 'Flycam & Aerial',         'Phong cảnh, sự kiện từ trên cao',4, true),
  ('05', 'Gói Headshot',            'Chụp nhanh cho doanh nghiệp',    5, true),
  ('06', 'Chiến dịch Thương hiệu',  'Ảnh thương hiệu & sản phẩm',     6, true),
  ('07', 'Editorial & Thời trang',  'Lookbook, tạp chí, nghệ thuật',  7, true)
) as v(display_number, title, subtitle, sort_order, published)
where not exists (select 1 from public.services);


-- ── page copy ──────────────────────────────────────────────────────────────

insert into public.content_blocks (key, data) values

('hero', $json$
{
  "words": ["NAHN", "PHOTO", "GRAPHY."],
  "meta": ["Hồ sơ Nhiếp ảnh", "2026", "Thành phố Hồ Chí Minh"],
  "scrollLabel": "Cuộn xuống"
}
$json$::jsonb),

('marquee', $json$
{
  "items": [
    "Chân dung Doanh nghiệp", "Headshot", "Nhiếp ảnh Sự kiện", "Flycam & Aerial",
    "Ảnh Nhân sự", "Chiến dịch Thương hiệu", "Nhiếp ảnh Hội nghị",
    "Ra mắt Sản phẩm", "Ảnh Đội nhóm", "Phong cảnh từ trên cao"
  ]
}
$json$::jsonb),

('statement', $json$
{
  "lines": ["TÔI CHỤP", "CON NGƯỜI,", "NƠI CHỐN,", "ÁNH SÁNG,", "VÀ", "MỌI THỨ", "Ở GIỮA."],
  "paragraph": "Tôi quan tâm đến những khoảnh khắc giữa các tư thế — biểu cảm, ánh sáng, chuyển động và những chi tiết khiến một bức ảnh trở nên cá nhân."
}
$json$::jsonb),

('about', $json$
{
  "headings": ["XIN CHÀO,", "TÔI LÀ NAHN."],
  "paragraphs": [
    "Nhiếp ảnh gia tại Thành phố Hồ Chí Minh.",
    "Tôi quan tâm đến con người, ánh sáng, du lịch và những khoảnh khắc thường ngày. Sẵn sàng nhận dự án editorial, thương mại và doanh nghiệp."
  ],
  "details": ["hello@nahn.photo", "0901 234 567", "Thành phố Hồ Chí Minh, Việt Nam"]
}
$json$::jsonb),

('contact', $json$
{
  "words": ["HÃY", "CÙNG", "TẠO RA", "ĐIỀU GÌ ĐÓ."],
  "emailLabel": "Email",
  "phoneLabel": "Điện thoại",
  "addressLabel": "Địa chỉ"
}
$json$::jsonb),

('footer', $json$
{
  "tagline": "Nhiếp ảnh · Tp. Hồ Chí Minh",
  "backToTop": "Về đầu trang ↑",
  "copyright": "NAHN © 2026"
}
$json$::jsonb),

('navigation', $json$
{
  "links": [
    { "label": "Tác phẩm",      "href": "#work" },
    { "label": "Flycam",        "href": "#flycam" },
    { "label": "Doanh nghiệp",  "href": "#business" },
    { "label": "Về tôi",        "href": "#about" },
    { "label": "Liên hệ",       "href": "#contact" }
  ]
}
$json$::jsonb),

('headings', $json$
{
  "selectedWorks": { "lines": ["TÁC PHẨM", "CHỌN LỌC."] },
  "gallery":       { "lines": ["BỘ SƯU TẬP", "CÁ NHÂN."] },
  "services":      { "eyebrow": "Dịch vụ cung cấp", "heading": "DỊCH VỤ." },
  "flycam": {
    "eyebrow": "Nhìn từ trên cao",
    "lines": ["FLYCAM", "AERIAL."],
    "description": "Góc nhìn từ flycam mang lại chiều sâu mới — từ ruộng bậc thang, vịnh biển đến sự kiện ngoài trời. Độ phân giải 4K, chứng chỉ bay hợp lệ."
  },
  "corporate": {
    "eyebrow": "Dành cho Doanh nghiệp",
    "lines": ["DOANH NGHIỆP", "& SỰ KIỆN."],
    "description": "Ảnh chân dung doanh nghiệp, sự kiện và nhân sự — được thực hiện với sự chỉn chu và nhất quán như mọi bộ ảnh editorial.",
    "headshotsLabel": "Chân dung Cá nhân & Headshot",
    "eventsLabel": "Nhiếp ảnh Sự kiện & Hội nghị",
    "teamsLabel": "Nhiếp ảnh Nhân sự & Đội nhóm"
  }
}
$json$::jsonb),

-- The oversized words set behind sections as a design element.
('ghost_words', $json$
{
  "locationSeries": "NGOẠI CẢNH",
  "events": "SỰ KIỆN.",
  "flycam": "TỪ TRÊN CAO.",
  "collage": "EDITORIAL",
  "stats": "CON SỐ."
}
$json$::jsonb),

('flycam_capabilities', $json$
{
  "items": [
    { "label": "Độ phân giải", "value": "4K / 12MP RAW" },
    { "label": "Độ cao bay",   "value": "Tối đa 400m" },
    { "label": "Địa hình",     "value": "Nội địa · Biển đảo" },
    { "label": "Chứng chỉ",    "value": "Bay hợp pháp" }
  ]
}
$json$::jsonb),

('stats', $json$
{
  "retouchLabel": "Chỉnh sửa Headshot",
  "beforeLabel": "Trước",
  "afterLabel": "Sau",
  "dragHint": "Kéo để so sánh",
  "items": [
    { "target": 120, "suffix": "+", "label": "Sự kiện đã chụp" },
    { "target": 45,  "suffix": "+", "label": "Doanh nghiệp đã phục vụ" },
    { "target": 800, "suffix": "+", "label": "Chân dung đã thực hiện" },
    { "target": 6,   "suffix": "",  "label": "Năm kinh nghiệm" }
  ],
  "note": "Từ startup đến tập đoàn lớn — mỗi dự án đều được thực hiện với sự chỉn chu và phong cách nhất quán."
}
$json$::jsonb),

('film_strip', $json$
{
  "heading": "35mm",
  "labels": ["Thước phim tiếp xúc", "NAHN · 2026 · Kéo để cuộn"]
}
$json$::jsonb),

('rosie_numerals', $json$
{
  "items": [
    { "numeral": "02", "label": "Ánh sáng buổi trưa" },
    { "numeral": "03", "label": "Buổi chiều" }
  ]
}
$json$::jsonb),

('ui_labels', $json$
{
  "lightboxClose": "ESC / ĐÓNG"
}
$json$::jsonb)

on conflict (key) do nothing;


-- ── what landed ────────────────────────────────────────────────────────────

select 'projects' as table_name, kind::text as detail, count(*) as rows
from public.projects group by kind
union all select 'services', '', count(*) from public.services
union all select 'content_blocks', '', count(*) from public.content_blocks
union all select 'site_settings', '', count(*) from public.site_settings
union all select 'project_images (expected 0)', '', count(*) from public.project_images
union all select 'gallery_images (expected 0)', '', count(*) from public.gallery_images
order by table_name;
