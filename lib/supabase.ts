import { createClient } from '@supabase/supabase-js';

// .env.local から読み込みつつ、念のため .trim() で見えないゴミを掃除します
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const supabase = createClient(supabaseUrl, supabaseKey);