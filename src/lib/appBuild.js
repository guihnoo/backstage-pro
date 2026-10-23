/**
 * Versão do app em uso x versão publicada.
 * O nome do arquivo principal (assets/index-XXXX.js) muda a cada publicação, então serve de "número da versão".
 * Não depende do service worker: funciona mesmo quando o iPhone segura o app antigo na tela inicial.
 */

const BUILD_RE = /assets\/index-([\w-]+)\.js/;

/** Versão que está rodando agora (null no modo de desenvolvimento). */
export function runningBuildId() {
  if (typeof document === 'undefined') return null;
  const src = [...document.scripts].map((s) => s.src).find((s) => BUILD_RE.test(s));
  return src?.match(BUILD_RE)?.[1] || null;
}

/** Versão publicada agora no servidor. `bp=` evita a cópia guardada pelo service worker. */
export async function latestBuildId() {
  try {
    const res = await fetch(`/index.html?bp=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.text()).match(BUILD_RE)?.[1] || null;
  } catch {
    return null;
  }
}

/** Há versão nova publicada? (false se offline ou em desenvolvimento) */
export async function hasNewerBuild() {
  const running = runningBuildId();
  if (!running) return false;
  const latest = await latestBuildId();
  return Boolean(latest) && latest !== running;
}

/** Tem o que o usuário está digitando ou uma janela aberta? Recarregar agora perderia o trabalho. */
export function isUserBusy() {
  if (typeof document === 'undefined') return false;
  if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return true;
  const tag = document.activeElement?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/** Limpa o cache do app (não o das informações offline) e recarrega na versão nova. */
export async function hardRefresh() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
  } catch { /* segue mesmo assim */ }
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => /precache|workbox/i.test(k)).map((k) => caches.delete(k)));
  } catch { /* segue mesmo assim */ }
  window.location.reload();
}
