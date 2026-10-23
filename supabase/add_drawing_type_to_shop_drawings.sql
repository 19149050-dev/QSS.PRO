-- ==============================================================================
-- Thêm cột phân loại khu vực (drawing_type) cho bảng shop_drawings:
-- Các giá trị: 'Hành lang', 'Căn hộ', 'CH+HL', 'Khác'
-- ==============================================================================

ALTER TABLE public.shop_drawings 
ADD COLUMN IF NOT EXISTS drawing_type text DEFAULT 'Căn hộ';

-- Tự động cập nhật dữ liệu cũ dựa theo tên bản vẽ:
-- 1. Căn hộ + Hành lang (CH+HL)
UPDATE public.shop_drawings
SET drawing_type = 'CH+HL'
WHERE (drawing_type IS NULL OR drawing_type = 'Căn hộ')
  AND (
    drawing_name ILIKE '%CH+HL%' 
    OR drawing_name ILIKE '%HL+CH%' 
    OR drawing_name ILIKE '%CH + HL%' 
    OR drawing_name ILIKE '%HL + CH%'
  );

-- 2. Hành lang (HL)
UPDATE public.shop_drawings
SET drawing_type = 'Hành lang'
WHERE (drawing_type IS NULL OR drawing_type = 'Căn hộ')
  AND (
    drawing_name ILIKE '%HÀNH LANG%' 
    OR drawing_name ILIKE '% HL %' 
    OR drawing_name ILIKE '% HL' 
    OR drawing_name ILIKE 'HL %'
    OR drawing_name ~* '(^|\s)HL(\s|$|-)'
  );

-- 3. Căn hộ (CH)
UPDATE public.shop_drawings
SET drawing_type = 'Căn hộ'
WHERE drawing_type IS NULL 
  AND (
    drawing_name ILIKE '%CĂN HỘ%' 
    OR drawing_name ILIKE '% CH %' 
    OR drawing_name ILIKE '% CH' 
    OR drawing_name ILIKE 'CH %'
    OR drawing_name ~* '(^|\s)CH(\s|$|-)'
  );
