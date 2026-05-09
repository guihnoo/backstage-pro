/**
 * Base URL para chamadas à API (proxy /api no Vite em dev quando VITE_API_URL=/api).
 */
export function apiUrl(path) {
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}
