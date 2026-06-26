const supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

/** Padrões de vibração para feedback tátil premium. */
const PATTERNS = {
  /** Toque leve — confirmar/selecionar */
  light: [10],
  /** Toque médio — ação importante */
  medium: [25],
  /** Sucesso (dois pulsos) */
  success: [15, 60, 15],
  /** Erro (três pulsos rápidos) */
  error: [30, 50, 30, 50, 30],
  /** Confirmação longa */
  confirm: [40],
};

function vibrate(pattern) {
  if (!supported) return;
  try { navigator.vibrate(pattern); } catch { /* ignore */ }
}

export const haptics = {
  light:   () => vibrate(PATTERNS.light),
  medium:  () => vibrate(PATTERNS.medium),
  success: () => vibrate(PATTERNS.success),
  error:   () => vibrate(PATTERNS.error),
  confirm: () => vibrate(PATTERNS.confirm),
};
