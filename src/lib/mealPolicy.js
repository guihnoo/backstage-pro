/**
 * Alimentacao por cliente (regra do dono, 17/10/2026).
 * - 'reembolso'     -> o cliente devolve: soma no "a receber" e no fechamento.
 * - 'pago_no_local' -> o cliente paga na hora: so informativo.
 * - 'custo_proprio' -> o tecnico paga: vira despesa (lancada em Despesas).
 * O evento pode trocar a regra so para ele; sem regra = nao soma nada (dados antigos nao mudam).
 */
export const MEAL_POLICIES = ['reembolso', 'pago_no_local', 'custo_proprio'];

export const MEAL_POLICY_LABELS = {
  reembolso: 'Cliente reembolsa',
  pago_no_local: 'Cliente paga no local',
  custo_proprio: 'Por minha conta',
};

const valid = (p) => (MEAL_POLICIES.includes(p) ? p : null);

/** Regra que vale para o evento: a do evento, senao a do cliente, senao nenhuma. */
export function resolveMealPolicy(event, client) {
  const c = client || event?.client || event?.clients || null;
  return valid(event?.meal_policy) || valid(c?.meal_policy) || null;
}

const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Valor de alimentacao de um dia (nunca negativo, nunca NaN). */
export function mealOfDay(work) {
  const v = Number(work?.meal_allowance);
  return Number.isFinite(v) && v > 0 ? money(v) : 0;
}

/** Quanto de alimentacao o cliente deve devolver (so quando a regra e reembolso). */
export function reimbursableMeals(event, rows = [], client) {
  if (resolveMealPolicy(event, client) !== 'reembolso') return 0;
  return money((rows || []).reduce((s, w) => s + mealOfDay(w), 0));
}
