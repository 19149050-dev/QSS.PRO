-- ==============================================================================
-- QSS PRO - CONSTRUCTION QS SYSTEM DATABASE SCHEMA FOR SUPABASE
-- URL: https://rfsxcdwwbztspetlfauz.supabase.co
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'QS', -- ADMIN, QS, GIÁM ĐỐC, THƯ KÝ, KẾ TOÁN VẬT TƯ, CHT, etc.
  status VARCHAR(50) DEFAULT 'Active',
  last_login VARCHAR(100),
  ip_login VARCHAR(50),
  signature_url TEXT,
  allow_view_financials BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  order_type VARCHAR(100) DEFAULT 'TRỰC TIẾP ORDER',
  sub_contractor_count INT DEFAULT 1,
  sub_contractor_info TEXT,
  address TEXT,
  contract_no VARCHAR(100),
  contract_date DATE,
  cht TEXT[], -- Array of Site Manager names
  contract_value NUMERIC(15,2) DEFAULT 0,
  addendum_value NUMERIC(15,2) DEFAULT 0,
  advance_payment NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Doing',
  progress INT DEFAULT 0,
  matrix_blocks JSONB DEFAULT '[]'::jsonb,
  matrix_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TEAMS TABLE (SUB-CONTRACTORS)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name VARCHAR(255),
  team_name VARCHAR(255) NOT NULL,
  leader_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  trade_type VARCHAR(255),
  worker_count INT DEFAULT 10,
  contract_value NUMERIC(15,2) DEFAULT 0,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  retention_amount NUMERIC(15,2) DEFAULT 0,
  remaining_amount NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Đang thi công',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. IPCS TABLE (INTERIM PAYMENT CERTIFICATES)
CREATE TABLE IF NOT EXISTS public.ipcs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(10) NOT NULL, -- 'A-B' (Investor) or 'B-C' (Sub-contractor)
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name VARCHAR(255),
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  team_name VARCHAR(255),
  period VARCHAR(50) NOT NULL, -- e.g. 'Đợt 01', 'Đợt 02'
  submit_date DATE DEFAULT CURRENT_DATE,
  approval_date DATE,
  proposed_amount NUMERIC(15,2) DEFAULT 0,
  approved_amount NUMERIC(15,2) DEFAULT 0,
  advance_deduction NUMERIC(15,2) DEFAULT 0,
  retention_rate NUMERIC(5,2) DEFAULT 5.0,
  retention_amount NUMERIC(15,2) DEFAULT 0,
  net_payable NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Đang chờ duyệt',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name VARCHAR(255),
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) DEFAULT 'Thùng',
  unit_price NUMERIC(15,2) DEFAULT 0,
  quantity_plan NUMERIC(12,2) DEFAULT 0,
  quantity_actual NUMERIC(12,2) DEFAULT 0,
  supplier VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Bình thường',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PAYMENT MATRIX TABLE (FLOORS & WORK PACKAGES)
CREATE TABLE IF NOT EXISTS public.payment_matrix (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  floor_level VARCHAR(20) NOT NULL,
  height NUMERIC(5,2),
  elevation NUMERIC(6,3),
  category VARCHAR(255) NOT NULL,
  batch_value VARCHAR(50), -- e.g., 'PK_1', 'PK_2'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_matrix ENABLE ROW LEVEL SECURITY;

-- Safely recreate policies (Drop policy if exists to avoid 42710 error)
DROP POLICY IF EXISTS "Allow public read users" ON public.users;
DROP POLICY IF EXISTS "Allow public write users" ON public.users;
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public write users" ON public.users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public write projects" ON public.projects;
CREATE POLICY "Allow public read projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public write projects" ON public.projects FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read teams" ON public.teams;
DROP POLICY IF EXISTS "Allow public write teams" ON public.teams;
CREATE POLICY "Allow public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow public write teams" ON public.teams FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read ipcs" ON public.ipcs;
DROP POLICY IF EXISTS "Allow public write ipcs" ON public.ipcs;
CREATE POLICY "Allow public read ipcs" ON public.ipcs FOR SELECT USING (true);
CREATE POLICY "Allow public write ipcs" ON public.ipcs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read materials" ON public.materials;
DROP POLICY IF EXISTS "Allow public write materials" ON public.materials;
CREATE POLICY "Allow public read materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Allow public write materials" ON public.materials FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read matrix" ON public.payment_matrix;
DROP POLICY IF EXISTS "Allow public write matrix" ON public.payment_matrix;
CREATE POLICY "Allow public read matrix" ON public.payment_matrix FOR SELECT USING (true);
CREATE POLICY "Allow public write matrix" ON public.payment_matrix FOR ALL USING (true);

