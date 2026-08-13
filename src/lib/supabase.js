import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rfsxcdwwbztspetlfauz.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_keIdSa76flAZC1eLeMmrhg_7dsNSoDz';

export const supabase = createClient(supabaseUrl, supabaseKey);
