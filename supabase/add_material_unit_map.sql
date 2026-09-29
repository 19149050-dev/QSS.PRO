ALTER TABLE public.material_sheets ADD COLUMN IF NOT EXISTS unit_map jsonb DEFAULT '{}'::jsonb;
