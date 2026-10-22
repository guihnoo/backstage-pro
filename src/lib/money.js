/**
 * Le valor em dinheiro digitado do jeito brasileiro (ou com ponto decimal).
 *   "1.200,50" -> 1200.5   "1200,5" -> 1200.5   "1.200" -> 1200
 *   "1200.50"  -> 1200.5   "R$ 850"  -> 850     ""/"abc" -> NaN
 */
export function parseBRL(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : NaN;
  let s = String(input ?? '').replace(/R\$/gi, '').replace(/\s/g, '').trim();
  if (!s) return NaN;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.200" / "12.500.000": pontos so de milhar
    s = s.replace(/\./g, '');
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

/** Valor para mostrar num campo de texto: 1200.5 -> "1200,50" (sem milhar, facil de editar). */
export function toBRLInput(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  return v.toFixed(2).replace('.', ',');
}

/** Horas no jeito brasileiro: 8 → "8h", 8.5 → "8,5h", 0.04 → "0h". */
export function formatHours(value) {
  const n = Math.round((Number(value) || 0) * 10) / 10;
  return `${Number.isInteger(n) ? n : n.toFixed(1).replace('.', ',')}h`;
}
