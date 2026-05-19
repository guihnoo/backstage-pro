/**
 * Atualiza Site URL e Redirect URLs via Management API.
 * Requer: SUPABASE_ACCESS_TOKEN (PAT em https://supabase.com/dashboard/account/tokens)
 * Uso: node scripts/push-supabase-auth-api.mjs
 */

const PROJECT_REF = 'cwtallnetgodoacuoaow';
const SITE_URL = 'https://backstage-pro-beta.vercel.app';
const REDIRECT_URLS = [
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5173/**',
  'http://localhost:5173',
  'http://localhost:5173/**',
  `${SITE_URL}`,
  `${SITE_URL}/**`,
];

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Defina SUPABASE_ACCESS_TOKEN (Personal Access Token do Supabase).');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const getRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  headers,
});
if (!getRes.ok) {
  console.error('GET auth config failed:', getRes.status, await getRes.text());
  process.exit(1);
}

const current = await getRes.json();
const existingList = (current.uri_allow_list || '')
  .split(/[\n,]/)
  .map((s) => s.trim())
  .filter(Boolean);
const merged = [...new Set([...existingList, ...REDIRECT_URLS])];

const patchRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({
    site_url: SITE_URL,
    uri_allow_list: merged.join('\n'),
  }),
});

if (!patchRes.ok) {
  console.error('PATCH auth config failed:', patchRes.status, await patchRes.text());
  process.exit(1);
}

console.log('OK — site_url:', SITE_URL);
console.log('OK — redirect URLs:', merged.length, 'entradas');
