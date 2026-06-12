/** Parsing de cidade/UF a partir de campos de localização de eventos (mapa, backfill, forms). */

export const BRAZIL_STATE_NAMES = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

const STATE_NAME_TO_UF = Object.fromEntries(
  Object.entries(BRAZIL_STATE_NAMES).map(([uf, name]) => [name.toUpperCase(), uf])
);

export function inferStateFromLocation(location = '') {
  const text = String(location).toUpperCase();
  for (const uf of Object.keys(BRAZIL_STATE_NAMES)) {
    if (new RegExp(`\\b${uf}\\b`).test(text)) return uf;
    const name = BRAZIL_STATE_NAMES[uf]?.toUpperCase();
    if (name && text.includes(name)) return uf;
  }
  return null;
}

export function normalizeStateCode(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper) && BRAZIL_STATE_NAMES[upper]) return upper;
  const byName = STATE_NAME_TO_UF[upper];
  if (byName) return byName;
  return inferStateFromLocation(trimmed);
}

export function inferCityFromLocation(location = '') {
  const text = String(location || '').trim();
  if (!text) return '';

  const tailUf = text.match(/([^,/\-–]+)[,\s/\-–]+([A-Za-z]{2})\s*$/);
  if (tailUf && BRAZIL_STATE_NAMES[tailUf[2].toUpperCase()]) {
    return tailUf[1].trim();
  }

  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    if (/^[A-Za-z]{2}$/.test(last) || STATE_NAME_TO_UF[last.toUpperCase()]) {
      return parts.length >= 3 ? parts[parts.length - 2] : parts[0];
    }
  }
  if (parts.length === 1 && !/\d{5}/.test(parts[0])) return parts[0];
  return '';
}

export function normalizeCityName(name = '') {
  return name.trim().replace(/\s+/g, ' ');
}

export function parseLocationFromEvent(event = {}) {
  const city = normalizeCityName(
    event.location_city || inferCityFromLocation(event.location) || ''
  );
  const state =
    normalizeStateCode(event.location_state) || inferStateFromLocation(event.location);

  return {
    city: city || null,
    state: state || null,
  };
}

/** Retorna patch { location_city?, location_state? } ou null se nada a preencher. */
export function buildLocationBackfillPatch(event = {}) {
  if (!event.location?.trim()) return null;

  const parsed = parseLocationFromEvent(event);
  const patch = {};

  if (!event.location_city?.trim() && parsed.city) {
    patch.location_city = parsed.city;
  }
  if (!event.location_state?.trim() && parsed.state) {
    patch.location_state = parsed.state;
  }

  return Object.keys(patch).length ? patch : null;
}
