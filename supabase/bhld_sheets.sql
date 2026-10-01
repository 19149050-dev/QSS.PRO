-- ==============================================================================
-- BHLD SHEETS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bhld_sheets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name text NOT NULL UNIQUE,
  rows jsonb DEFAULT '[]'::jsonb,
  custom_teams jsonb DEFAULT '[]'::jsonb,
  inactive_teams jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.bhld_sheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read bhld_sheets" ON public.bhld_sheets;
DROP POLICY IF EXISTS "Allow public write bhld_sheets" ON public.bhld_sheets;

CREATE POLICY "Allow public read bhld_sheets"
  ON public.bhld_sheets
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public write bhld_sheets"
  ON public.bhld_sheets
  FOR ALL
  USING (true);
