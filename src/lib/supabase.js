import { createClient } from '@supabase/supabase-js';

/** HTTP header values must be ISO-8859-1 (ByteString). BOM/unicode in env vars breaks fetch. */
function toLatin1HeaderValue(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim().replace(/^\uFEFF/, '');
  return trimmed.replace(/[^\u0000-\u00FF]/g, '');
}

function sanitizeRequestHeaders(headers) {
  if (!headers) return headers;

  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    const next = new Headers();
    headers.forEach((value, key) => {
      next.set(key, toLatin1HeaderValue(value));
    });
    return next;
  }

  if (Array.isArray(headers)) {
    return headers.map(([key, value]) => [key, toLatin1HeaderValue(value)]);
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, toLatin1HeaderValue(value)])
  );
}

function latin1SafeFetch(input, init) {
  if (!init?.headers) return fetch(input, init);
  return fetch(input, { ...init, headers: sanitizeRequestHeaders(init.headers) });
}

function loadSupabaseEnv(name) {
  const raw = import.meta.env[name];
  const cleaned = toLatin1HeaderValue(raw);
  if (import.meta.env.DEV && typeof raw === 'string' && raw !== cleaned) {
    console.error(
      `[Backstage Pro] ${name} contém caracteres inválidos para HTTP (removidos). Revise .env.local ou a Vercel.`
    );
  }
  return cleaned;
}

const supabaseUrl = loadSupabaseEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = loadSupabaseEnv('VITE_SUPABASE_ANON_KEY');

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
  isSupabaseConfigured ? supabaseAnonKey : placeholderKey,
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: latin1SafeFetch,
    },
  }
);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[Backstage Pro] Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local (ou na Vercel → Settings → Environment Variables).'
  );
}
