/**
 * Backfill em massa: location_city / location_state a partir de events.location
 *
 * Uso:
 *   node scripts/backfill-event-locations.mjs
 *   node scripts/backfill-event-locations.mjs --user-id <UUID>
 *   node scripts/backfill-event-locations.mjs --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');

const BRAZIL_STATE_NAMES = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

const STATE_NAME_TO_UF = Object.fromEntries(
  Object.entries(BRAZIL_STATE_NAMES).map(([uf, name]) => [name.toUpperCase(), uf])
);

function inferStateFromLocation(location = '') {
  const text = String(location).toUpperCase();
  for (const uf of Object.keys(BRAZIL_STATE_NAMES)) {
    if (new RegExp(`\\b${uf}\\b`).test(text)) return uf;
    const name = BRAZIL_STATE_NAMES[uf]?.toUpperCase();
    if (name && text.includes(name)) return uf;
  }
  return null;
}

function normalizeStateCode(raw) {
  if (!raw) return null;
  const upper = String(raw).trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(upper) && BRAZIL_STATE_NAMES[upper]) return upper;
  return STATE_NAME_TO_UF[upper] || inferStateFromLocation(upper);
}

function inferCityFromLocation(location = '') {
  const text = String(location || '').trim();
  if (!text) return '';
  const tailUf = text.match(/([^,/\-–]+)[,\s/\-–]+([A-Za-z]{2})\s*$/);
  if (tailUf && BRAZIL_STATE_NAMES[tailUf[2].toUpperCase()]) return tailUf[1].trim();
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

function buildPatch(row) {
  if (!row.location?.trim()) return null;
  const patch = {};
  if (!row.location_city?.trim()) {
    const city = inferCityFromLocation(row.location).trim();
    if (city) patch.location_city = city;
  }
  if (!row.location_state?.trim()) {
    const uf = normalizeStateCode(row.location_state) || inferStateFromLocation(row.location);
    if (uf) patch.location_state = uf;
  }
  return Object.keys(patch).length ? patch : null;
}

function loadEnv() {
  const envPath = resolve(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('[backfill] .env.local não encontrado');
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    env[key.trim()] = rest.join('=').trim();
  }
  return env;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const userIdx = process.argv.indexOf('--user-id');
  const userId = userIdx !== -1 ? process.argv[userIdx + 1] : null;

  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[backfill] VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  let query = supabase
    .from('events')
    .select('id, user_id, location, location_city, location_state')
    .not('location', 'is', null)
    .or('location_city.is.null,location_state.is.null');

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) {
    console.error('[backfill] Erro ao buscar eventos:', error.message);
    process.exit(1);
  }

  const rows = (data || []).filter((row) => row.location?.trim());
  let wouldUpdate = 0;
  let updated = 0;

  for (const row of rows) {
    const patch = buildPatch(row);
    if (!patch) continue;
    wouldUpdate += 1;
    if (dryRun) {
      console.log(`[dry-run] ${row.id}`, patch);
      continue;
    }
    const { error: upErr } = await supabase.from('events').update(patch).eq('id', row.id);
    if (upErr) {
      console.warn(`[backfill] Falha ${row.id}:`, upErr.message);
    } else {
      updated += 1;
    }
  }

  console.log(
    dryRun
      ? `[backfill] Dry-run: ${wouldUpdate} evento(s) seriam atualizados (de ${rows.length} candidatos)`
      : `[backfill] Concluído: ${updated}/${wouldUpdate} atualizados (${rows.length} candidatos)`
  );
}

main();
