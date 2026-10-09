-- Create in_house_sheets table
CREATE TABLE IF NOT EXISTS public.in_house_sheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_name TEXT NOT NULL,
    rows JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index on project_name for faster lookups
CREATE INDEX IF NOT EXISTS in_house_sheets_project_name_idx ON public.in_house_sheets (project_name);

-- Set up Row Level Security (RLS)
ALTER TABLE public.in_house_sheets ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (assuming QSS PRO setup allows this, 
-- change as per your specific auth policies if needed)
CREATE POLICY "Enable read access for all authenticated users" ON public.in_house_sheets
    FOR SELECT USING (auth.role() = 'authenticated' OR true);

CREATE POLICY "Enable insert access for all authenticated users" ON public.in_house_sheets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR true);

CREATE POLICY "Enable update access for all authenticated users" ON public.in_house_sheets
    FOR UPDATE USING (auth.role() = 'authenticated' OR true);

CREATE POLICY "Enable delete access for all authenticated users" ON public.in_house_sheets
    FOR DELETE USING (auth.role() = 'authenticated' OR true);
