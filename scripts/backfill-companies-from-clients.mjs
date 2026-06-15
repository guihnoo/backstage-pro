/**
 * Cria/atualiza registros em `companies` a partir de clients sem company_id.
 *
 * Uso:
 *   node scripts/backfill-companies-from-clients.mjs
 *   node scripts/backfill-companies-from-clients.mjs --dry-run
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

function normalizeKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const env = loadEnv();
  const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: clients, error } = await sb
    .from('clients')
    .select('id, user_id, name, phone, email, logo_url, city, state, client_type, company_id')
    .is('company_id', null)
    .neq('client_type', 'pessoa');

  if (error) {
    console.error('[backfill] Erro ao ler clients:', error.message);
    process.exit(1);
  }

  const rows = (clients || []).filter((c) => c.name?.trim());
  console.log(`\n=== Backfill companies ← clients ===\n`);
  console.log(`Clientes empresa sem company_id: ${rows.length}`);
  if (dryRun) console.log('(modo dry-run — nenhuma escrita)\n');

  let linked = 0;
  let created = 0;

  for (const client of rows) {
    const name = client.name.trim();
    const key = normalizeKey(name);

    const { data: candidates } = await sb
      .from('companies')
      .select('id, name, trading_name')
      .or(`name.ilike.%${name}%,trading_name.ilike.%${name}%`)
      .limit(20);

    let company = (candidates || []).find((c) => {
      const names = [c.trading_name, c.name].filter(Boolean).map(normalizeKey);
      return names.includes(key);
    });

    if (!company && !dryRun) {
      const { data: inserted, error: insErr } = await sb
        .from('companies')
        .insert({
          name,
          trading_name: name,
          phone: client.phone,
          email: client.email,
          logo_url: client.logo_url,
          city: client.city,
          state: client.state,
          source: 'manual',
          created_by: client.user_id,
        })
        .select('id, name')
        .single();
      if (insErr) {
        console.warn(`  ✗ ${name}: ${insErr.message}`);
        continue;
      }
      company = inserted;
      created += 1;
    } else if (!company) {
      console.log(`  + criaria empresa: ${name}`);
      continue;
    }

    if (dryRun) {
      console.log(`  → vincularia ${name} → ${company.name || company.trading_name}`);
      continue;
    }

    const { error: upErr } = await sb
      .from('clients')
      .update({ company_id: company.id })
      .eq('id', client.id);
    if (upErr) {
      console.warn(`  ✗ link ${name}: ${upErr.message}`);
      continue;
    }
    linked += 1;
    console.log(`  ✓ ${name} → ${company.id}`);
  }

  if (!dryRun) {
    console.log(`\nConcluído: ${created} empresas criadas, ${linked} clients vinculados.\n`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
