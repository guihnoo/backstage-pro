// Animações decorativas infinitas (brilhos, feixes de luz, ícones flutuando) gastam
// processador e bateria o tempo todo no celular. Em celular, aparelho modesto, economia de
// dados ou "reduzir movimento" ligado, elas rodam uma vez e param.
function detectLite() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
    if (window.matchMedia?.('(max-width: 767px)').matches) return true;
  } catch { /* navegador antigo */ }
  const nav = window.navigator || {};
  if (nav.connection?.saveData) return true;
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) return true;
  return false;
}

export const LITE_MOTION = detectLite();

/** Use no lugar de `repeat: Infinity` em animações só decorativas. */
export const LOOP = LITE_MOTION ? 0 : Infinity;

/**
 * Animacao decorativa em loop: no celular/aparelho modesto NAO anima nada (nem uma vez).
 * Medido em 19/10: rodar "uma vez" justo na abertura custava processador no pior momento.
 */
export const loopAnim = (anim) => (LITE_MOTION ? undefined : anim);
