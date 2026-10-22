// Quilometragem virando despesa (ideia #112): km × valor por km, com ida e volta.
// O valor em reais vai em expenses.amount; os km rodados (já somando a volta) em expenses.distance_km.

export const KM_CATEGORY = 'quilometragem';
// Sugestão inicial (combustível + desgaste de um carro popular); o técnico ajusta e o app lembra.
export const DEFAULT_KM_RATE = 1.2;

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return NaN;
  if (typeof value === 'number') return value;
  const s = String(value).trim().replace(/\s/g, '');
  // Aceita "1,20", "1.20", "1.234,5"
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  return Number(normalized);
}

const round2 = (n) => Math.round(n * 100) / 100;
const round1 = (n) => Math.round(n * 10) / 10;

/** { totalKm, amount } — null quando falta km ou valor válido. */
export function calcMileage({ km, rate, roundTrip = false }) {
  const k = toNumber(km);
  const r = toNumber(rate);
  if (!Number.isFinite(k) || !Number.isFinite(r) || k <= 0 || r < 0) return null;
  const totalKm = round1(roundTrip ? k * 2 : k);
  return { totalKm, amount: round2(totalKm * r) };
}

function brl(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function kmText(n) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

/** Texto que fica na despesa: "2 × 45 km (ida e volta) × R$ 1,20/km". */
export function mileageNote({ km, rate, roundTrip = false }) {
  const k = toNumber(km);
  const r = toNumber(rate);
  if (!Number.isFinite(k) || !Number.isFinite(r) || k <= 0) return '';
  const kmPart = roundTrip ? `2 × ${kmText(k)} km (ida e volta)` : `${kmText(k)} km`;
  return `${kmPart} × R$ ${brl(r)}/km`;
}

/** Ao editar uma despesa de km: devolve km e valor por km que geraram o valor gravado. */
export function mileageFromExpense(expense) {
  const totalKm = toNumber(expense?.distance_km);
  const amount = toNumber(expense?.amount);
  if (!Number.isFinite(totalKm) || totalKm <= 0) return null;
  const rate = Number.isFinite(amount) && amount >= 0 ? round2(amount / totalKm) : DEFAULT_KM_RATE;
  return { km: totalKm, rate, roundTrip: false };
}

export function parseKmRate(value) {
  const r = toNumber(value);
  return Number.isFinite(r) && r >= 0 && r <= 100 ? round2(r) : null;
}
