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

/** Consulta de dados que não responde em 20 s vira erro (a tela mostra "Tentar de novo" em vez de carregar para sempre). */
const DATA_REQUEST_TIMEOUT_MS = 20_000;

function fetchWithTimeout(input, init) {
  const url = typeof input === 'string' ? input : input?.url || '';
  // Só dados (/rest/v1/). Envio de arquivo e IA podem demorar de verdade.
  if (!url.includes('/rest/v1/')) return fetch(input, init);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('Tempo esgotado', 'TimeoutError')), DATA_REQUEST_TIMEOUT_MS);
  const outer = init?.signal;
  if (outer) {
    if (outer.aborted) controller.abort(outer.reason);
    else outer.addEventListener('abort', () => controller.abort(outer.reason), { once: true });
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// Sessão vencida (10/11): um computador ficou a madrugada com o login vencido e o app seguiu
// pedindo dados (centenas de 401, telas vazias). Ao ver "JWT expired" tenta renovar uma vez;
// se não der, sai neste aparelho e a tela de login aparece.
let recovering = null;
function recoverExpiredSession() {
  if (recovering) return recovering;
  recovering = (async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      // Só sai quando o servidor recusou a renovação (sem rede ou erro temporário: mantém o login).
      const recusado = error && !String(error.name || '').includes('Retryable') && error.status >= 400 && error.status < 500;
      if (recusado && navigator.onLine !== false) await supabase.auth.signOut({ scope: 'local' });
    } catch {
      /* sem rede: tenta de novo no próximo 401 */
    } finally {
      setTimeout(() => { recovering = null; }, 30_000);
    }
  })();
  return recovering;
}

async function watchExpired(responsePromise, input) {
  const res = await responsePromise;
  try {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (res.status === 401 && /\/rest\/v1\/[a-z_]/.test(url)) {
      const body = await res.clone().text();
      if (/JWT expired/i.test(body)) recoverExpiredSession();
    }
  } catch {
    /* só observação */
  }
  return res;
}

function latin1SafeFetch(input, init) {
  if (!init?.headers) return watchExpired(fetchWithTimeout(input, init), input);
  return watchExpired(fetchWithTimeout(input, { ...init, headers: sanitizeRequestHeaders(init.headers) }), input);
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
