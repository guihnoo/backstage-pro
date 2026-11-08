/**
 * Feedback visual único do app (08/11): ✓ que se desenha ao salvar e confete leve em
 * momentos de dinheiro (recebimento confirmado, pendências zeradas).
 * Só dispara eventos; quem desenha é <FeedbackLayer /> (montado no AppLayout).
 */
import { haptics } from './haptics';

const EVENT = 'bp:feedback';

// Mensagens de sucesso que significam "gravou algo" — elas ganham o ✓ animado.
const SAVE_WORDS = /salv|registrad|criad|atualizad|gravad|adicionad|exclu[ií]d|removid|resolvid|aplicad|marcad|confirmad/i;

function emit(detail) {
  if (typeof window === 'undefined') return;
  try { window.dispatchEvent(new CustomEvent(EVENT, { detail })); } catch { /* sem DOM */ }
}

export function saveFeedback() {
  emit({ kind: 'save', at: Date.now() });
}

export function confetti() {
  haptics.success();
  emit({ kind: 'confetti', at: Date.now() });
}

/** Usado pelo appToast.success: só mensagens de gravação ganham o ✓. */
export function isSaveMessage(title) {
  return typeof title === 'string' && SAVE_WORDS.test(title);
}

export const FEEDBACK_EVENT = EVENT;
