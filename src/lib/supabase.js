import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key-here'
);

const placeholderUrl = 'https://placeholder.supabase.co';
const placeholderKey = 'placeholder-anon-key';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : placeholderUrl,
  isSupabaseConfigured ? supabaseAnonKey : placeholderKey
);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[Backstage Pro] Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local (ou na Vercel → Settings → Environment Variables).'
  );
}
