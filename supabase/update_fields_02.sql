-- Cập nhật bảng projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS investor text,
ADD COLUMN IF NOT EXISTS receiver text;

-- Cập nhật bảng material_orders
ALTER TABLE public.material_orders
ADD COLUMN IF NOT EXISTS receiver text;
