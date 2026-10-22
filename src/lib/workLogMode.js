// Como o técnico registra o trabalho (ideia #107):
//  'completo' → ficha com horas, extras, escolha do dia, alimentação e observações;
//  'ponto'    → só entrada e saída (bater o ponto); horas e cachê saem da mesma regra (workDay.js).
// O trabalho pode ter a sua própria escolha (events.work_log_mode); sem ela, vale a do Perfil.

export const WORK_LOG_MODES = [
  { id: 'completo', label: 'Ficha completa', hint: 'Horas, extras, alimentação e observações' },
  { id: 'ponto', label: 'Só entrada e saída', hint: 'Bate o ponto e o app calcula horas e cachê' },
];

export function isWorkLogMode(value) {
  return value === 'completo' || value === 'ponto';
}

export function resolveWorkLogMode(event, profile) {
  if (isWorkLogMode(event?.work_log_mode)) return event.work_log_mode;
  if (isWorkLogMode(profile?.work_log_mode)) return profile.work_log_mode;
  return 'completo';
}

/** O que gravar no trabalho: null quando a escolha é igual à do Perfil (assim segue o Perfil se ele mudar). */
export function eventWorkLogModeToSave(chosen, profile) {
  const profileMode = isWorkLogMode(profile?.work_log_mode) ? profile.work_log_mode : 'completo';
  return isWorkLogMode(chosen) && chosen !== profileMode ? chosen : null;
}

/** Hora atual em HH:MM (fuso do aparelho). */
export function clockNow(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
