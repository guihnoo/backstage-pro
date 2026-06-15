/**
 * Copia logo_url de clients vinculados para companies sem logo.
 *
 * Uso:
 *   node scripts/backfill-company-logos-from-clients.mjs
 *   node scripts/backfill-company-logos-from-clients.mjs --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');

function loadEnv() {
  const envPath = resolve(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('[backfill-logos] .env.local não encontrado');
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

function displayName(c) {
  return c.trading_name || c.name || '(sem nome)';
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const env = loadEnv();
  const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const [{ data: companies, error: coErr }, { data: clients, error: clErr }] = await Promise.all([
    sb.from('companies').select('id, name, trading_name, logo_url').is('logo_url', null),
    sb.from('clients').select('company_id, logo_url').not('company_id', 'is', null).not('logo_url', 'is', null),
  ]);

  if (coErr || clErr) {
    console.error('[backfill-logos] Erro:', coErr?.message || clErr?.message);
    process.exit(1);
  }

  const logoByCompany = new Map();
  for (const c of clients || []) {
    if (!logoByCompany.has(c.company_id)) logoByCompany.set(c.company_id, c.logo_url);
  }

  const targets = (companies || []).filter((co) => logoByCompany.has(co.id));

  console.log(`\n=== Backfill logos: clients → companies ===\n`);
  console.log(`Empresas sem logo: ${companies?.length || 0}`);
  console.log(`Com logo disponível em client: ${targets.length}`);
  if (dryRun) console.log('(modo dry-run — nenhuma escrita)\n');

  let updated = 0;
  for (const co of targets) {
    const logo = logoByCompany.get(co.id);
    console.log(`  • ${displayName(co)} ← ${logo.slice(0, 60)}${logo.length > 60 ? '…' : ''}`);
    if (!dryRun) {
      const { error } = await sb.from('companies').update({ logo_url: logo }).eq('id', co.id);
      if (error) {
        console.error(`    ✗ ${error.message}`);
        continue;
      }
    }
    updated += 1;
  }

  console.log(`\n${dryRun ? 'Seriam atualizadas' : 'Atualizadas'}: ${updated} empresa(s).\n`);
}

main().catch((err) => {
  console.error('[backfill-logos] Falha:', err);
  process.exit(1);
});
