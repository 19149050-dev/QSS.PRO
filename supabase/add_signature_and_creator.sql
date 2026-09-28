-- ==============================================================================
-- CẬP NHẬT TRƯỜNG CHỮ KÝ VÀ NGƯỜI TẠO PHIẾU
-- ==============================================================================

-- 1. Thêm signature_url vào bảng users (nếu chưa có)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signature_url text;

-- 2. Thêm created_by_id và receiver vào bảng material_orders (nếu chưa có)
ALTER TABLE public.material_orders ADD COLUMN IF NOT EXISTS created_by_id text;
ALTER TABLE public.material_orders ADD COLUMN IF NOT EXISTS receiver text;
