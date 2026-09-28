-- ==============================================================================
-- SUPABASE SQL SCRIPT: PHIẾU ĐẶT VẬT TƯ
-- Sao chép toàn bộ đoạn mã này và dán vào Supabase SQL Editor rồi bấm "Run"
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.material_orders (
  id text PRIMARY KEY,
  project_name text NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'pending',
  date text,
  quantities jsonb DEFAULT '{}'::jsonb,
  note text,
  created_by_id text,
  receiver text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.material_orders ADD COLUMN IF NOT EXISTS created_by_id text;
ALTER TABLE public.material_orders ADD COLUMN IF NOT EXISTS receiver text;

-- Bật Row Level Security (RLS)
ALTER TABLE public.material_orders ENABLE ROW LEVEL SECURITY;

-- Cấp quyền truy cập RLS công khai (Public Access)
DROP POLICY IF EXISTS "Allow public read material_orders" ON public.material_orders;
DROP POLICY IF EXISTS "Allow public write material_orders" ON public.material_orders;

CREATE POLICY "Allow public read material_orders"
  ON public.material_orders
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public write material_orders"
  ON public.material_orders
  FOR ALL
  USING (true);
