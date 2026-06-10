import { getAppNavigate } from './appNavigate';

function currentPath() {
  return `${window.location.pathname}${window.location.search}`;
}

/** Navegação in-app via React Router quando disponível; fallback full-page fora do shell. */
export function hardNavigate(path, { replace = false } = {}) {
  const current = currentPath();
  if (current === path || (path !== '/' && current.startsWith(path))) return;

  const navigate = getAppNavigate();
  if (navigate) {
    navigate(path, { replace });
    return;
  }

  if (replace) window.location.replace(path);
  else window.location.assign(path);
}
