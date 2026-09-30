import { createClient } from '@supabase/supabase-js';

// .env.local に書いた鍵を読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabaseとの接続クライアントを作成してエクスポート
export const supabase = createClient(supabaseUrl, supabaseKey);