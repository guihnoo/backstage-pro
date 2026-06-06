import { supabase } from './supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

export function getSupabaseProjectRef(url) {
  try {
    const host = new URL(url || supabaseUrl).hostname;
    const match = host.match(/^([^.]+)\.supabase\.co$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function checkSupabaseReachable() {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && error.message?.includes('fetch')) {
      return { ok: false, url: supabaseUrl };
    }
    return { ok: true, url: supabaseUrl };
  } catch {
    return { ok: false, url: supabaseUrl };
  }
}

export async function assertSupabaseReachable() {
  const result = await checkSupabaseReachable();
  if (!result.ok) {
    throw new Error(
      `Não foi possível conectar ao Supabase (${supabaseUrl}). Verifique sua conexão.`
    );
  }
}
