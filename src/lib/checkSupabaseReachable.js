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
  const configured =
    supabaseUrl &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseUrl.includes('.supabase.co');

  if (!configured) {
    return { ok: false, url: supabaseUrl };
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return { ok: res.ok || res.status === 401, url: supabaseUrl };
  } catch {
    return { ok: false, url: supabaseUrl };
  }
}

export async function assertSupabaseReachable() {
  const result = await checkSupabaseReachable();
  if (!result.ok) {
    throw new Error(
      `Não foi possível conectar ao Supabase. Verifique sua conexão.`
    );
  }
}
