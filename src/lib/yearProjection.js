/**
 * Projecao do ano ate dezembro: media mensal do ano ate agora (inclui o mes atual
 * e meses sem receita) vezes 12. Regra unica usada em Metas e no painel do MEI
 * (decisao do dono em 17/10/2026), para as duas telas mostrarem o mesmo numero.
 */
export function projectYearEnd(totalYear, monthsElapsed) {
  const total = Number(totalYear) || 0;
  const meses = Math.min(12, Math.max(1, Math.floor(Number(monthsElapsed) || 1)));
  return (total / meses) * 12;
}
