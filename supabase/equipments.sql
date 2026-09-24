-- ==============================================================================
-- SUPABASE SQL SCRIPT: KHO THIẾT BỊ & CẬP NHẬT ĐIỂM DANH TỔ ĐỘI
-- Sao chép toàn bộ đoạn mã này và dán vào Supabase SQL Editor rồi bấm "Run"
-- ==============================================================================

-- 1. BẢNG KHO THIẾT BỊ (equipments)
CREATE TABLE IF NOT EXISTS public.equipments (
  id text PRIMARY KEY,
  name text NOT NULL,
  import_date text,
  price numeric(15,2) DEFAULT 0,
  project_name text,
  warranty_period text,
  status text DEFAULT 'Mới',
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Bật Row Level Security (RLS)
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

-- Cấp quyền truy cập RLS công khai (Public Access)
DROP POLICY IF EXISTS "Allow public read equipments" ON public.equipments;
DROP POLICY IF EXISTS "Allow public write equipments" ON public.equipments;

CREATE POLICY "Allow public read equipments"
  ON public.equipments
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public write equipments"
  ON public.equipments
  FOR ALL
  USING (true);

-- 2. BỔ SUNG CỘT inactive_teams CHO BẢNG DIỂM DANH TỔ ĐỘI (attendance_sheets)
ALTER TABLE public.attendance_sheets ADD COLUMN IF NOT EXISTS inactive_teams jsonb DEFAULT '[]'::jsonb;

-- 3. CHÈN DỮ LIỆU MẪU BAN ĐẦU CHO KHO THIẾT BỊ (Nếu chưa có)
INSERT INTO public.equipments (id, name, import_date, price, project_name, warranty_period, status, notes)
VALUES 
  ('eq-1', 'Máy trộn bê tông 350L', '15/01/2026', 18500000, 'BCONS TĐH', '24 Tháng', 'Đang sử dụng', 'Đã cấp cho đội thi công tầng 3'),
  ('eq-2', 'Máy đầm bàn Mikasa 5.5HP', '20/02/2026', 12000000, 'BCONS TĐH', '12 Tháng', 'Đang sử dụng', 'Kiểm tra định kỳ hàng tháng'),
  ('eq-3', 'Máy cắt sắt GQ40 3KW', '05/03/2026', 24500000, 'SUNHOME', '36 Tháng', 'Mới', 'Mới nhập kho dự phòng'),
  ('eq-4', 'Máy uốn sắt GW40', '10/11/2025', 21000000, 'THE ASPIRA', '24 Tháng', 'Cần bảo trì', 'Kẹt động cơ, chờ thay linh kiện'),
  ('eq-5', 'Máy phun sơn áp lực cao Graco', '18/04/2026', 45000000, 'BCONS TĐH', '24 Tháng', 'Đang sử dụng', 'Phục vụ công tác sơn hoàn thiện')
ON CONFLICT (id) DO NOTHING;
