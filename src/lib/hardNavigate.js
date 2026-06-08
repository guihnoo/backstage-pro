/** Navegação full-page — evita dessincronia URL vs React Router (mesmo padrão da bottom nav). */
export function hardNavigate(path, { replace = false } = {}) {
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === path || (path !== '/' && current.startsWith(path))) return;
  if (replace) window.location.replace(path);
  else window.location.assign(path);
}
