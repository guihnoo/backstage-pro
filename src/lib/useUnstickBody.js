import { useEffect } from 'react';

/**
 * Destrava a tela quando uma janela fecha e deixa o app "sem toque".
 * Defeito conhecido do Radix: ao fechar uma janela e abrir outra logo em seguida, o <body> pode
 * ficar com pointer-events:none / scroll travado e so voltava atualizando a pagina (achado do Guih, 18/10).
 * Se nao ha nenhuma janela/menu aberto, limpa a trava.
 */
const OPEN_LAYER = [
  '[role="dialog"][data-state="open"]',
  '[role="alertdialog"][data-state="open"]',
  '[data-radix-popper-content-wrapper]',
  '[data-vaul-drawer][data-state="open"]',
].join(',');

export function unstickBody(doc = document) {
  if (doc.querySelector(OPEN_LAYER)) return false;
  const b = doc.body;
  let changed = false;
  if (b.style.pointerEvents === 'none') { b.style.pointerEvents = ''; changed = true; }
  if (b.hasAttribute('data-scroll-locked')) {
    b.removeAttribute('data-scroll-locked');
    b.style.removeProperty('overflow');
    b.style.removeProperty('padding-right');
    b.style.removeProperty('margin-right');
    changed = true;
  }
  return changed;
}

export function useUnstickBody() {
  useEffect(() => {
    let timer;
    const schedule = () => { clearTimeout(timer); timer = setTimeout(() => unstickBody(), 450); };
    const obs = new MutationObserver(schedule);
    obs.observe(document.body, { attributes: true, attributeFilter: ['style', 'data-scroll-locked'], childList: true });
    window.addEventListener('popstate', schedule);
    return () => { obs.disconnect(); clearTimeout(timer); window.removeEventListener('popstate', schedule); };
  }, []);
}
