CREATE TABLE in_house_archives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  duration_label TEXT NOT NULL,
  rows_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Enable RLS and add basic policies if needed
ALTER TABLE in_house_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all actions for all users" ON in_house_archives FOR ALL USING (true);
