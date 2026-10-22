// Várias funções com cachê diferente (ideia #109).
// Perfil: função principal = profiles.category + profiles.daily_rate (como sempre);
//         outras funções   = profiles.role_rates = [{ category, daily_rate }].
// Trabalho: a função escolhida vai em events.category / events.category_label.
import { CATEGORIES, resolveCategoryId } from '@/lib/categoryConfig';

export function categoryLabel(categoryId) {
  const id = resolveCategoryId(categoryId || '');
  return CATEGORIES[id]?.label || '';
}

function toRate(value) {
  if (value === '' || value === null || value === undefined) return NaN;
  const s = String(value).trim();
  const n = Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

/** Lista limpa: só funções que existem, uma vez cada, com cachê > 0, sem repetir a principal. */
export function normalizeRoleRates(raw, mainCategory = null) {
  const main = mainCategory ? resolveCategoryId(mainCategory) : null;
  const seen = new Set();
  const out = [];
  for (const item of Array.isArray(raw) ? raw : []) {
    const id = resolveCategoryId(item?.category || '');
    const rate = toRate(item?.daily_rate);
    if (!CATEGORIES[id] || id === main || seen.has(id) || !(rate > 0)) continue;
    seen.add(id);
    out.push({ category: id, daily_rate: rate });
  }
  return out;
}

/** Formulário do Perfil guarda { categoria: 'texto digitado' }; vira a lista gravada. */
export function ratesMapToList(map, mainCategory) {
  return normalizeRoleRates(
    Object.entries(map || {}).map(([category, daily_rate]) => ({ category, daily_rate })),
    mainCategory
  );
}

export function ratesListToMap(list) {
  const map = {};
  for (const { category, daily_rate } of normalizeRoleRates(list)) {
    map[category] = String(daily_rate).replace('.', ',');
  }
  return map;
}

/** Funções do técnico para escolher no trabalho: principal primeiro. */
export function functionOptions(profile) {
  const main = resolveCategoryId(profile?.category || '');
  const options = [];
  if (CATEGORIES[main]) {
    options.push({ id: main, label: categoryLabel(main), rate: toRate(profile?.daily_rate) > 0 ? toRate(profile.daily_rate) : null, primary: true });
  }
  for (const { category, daily_rate } of normalizeRoleRates(profile?.role_rates, main)) {
    options.push({ id: category, label: categoryLabel(category), rate: daily_rate, primary: false });
  }
  return options;
}

export function rateForFunction(profile, categoryId) {
  const id = resolveCategoryId(categoryId || '');
  return functionOptions(profile).find((o) => o.id === id)?.rate ?? null;
}

/** Função de um trabalho: a escolhida nele; sem escolha, a principal do Perfil. */
export function eventFunctionId(event, profile) {
  const id = resolveCategoryId(event?.category || '');
  if (CATEGORIES[id]) return id;
  const main = resolveCategoryId(profile?.category || '');
  return CATEGORIES[main] ? main : null;
}
