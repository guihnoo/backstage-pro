/**
 * Vincula eventos ativos sem client_id ao cliente do mesmo usuário (match por título).
 *
 * Uso:
 *   node scripts/backfill-orphan-event-clients.mjs --dry-run
 *   node scripts/backfill-orphan-event-clients.mjs
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
    console.error('[backfill-events] .env.local não encontrado');
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

function matchScore(eventTitle, clientName) {
  const et = normalizeKey(eventTitle);
  const cn = normalizeKey(clientName);
  if (!et || !cn) return 0;
  if (et === cn) return 100;
  if (cn.startsWith(et) || cn.includes(et)) return 85;
  if (et.startsWith(cn)) return 75;
  const words = et.split(/\s+/).filter((w) => w.length >= 3);
  if (words.some((w) => cn.includes(w))) return 60;
  return 0;
}

function pickClient(event, clients, companiesById) {
  let best = null;
  let bestScore = 0;

  for (const client of clients) {
    const score = matchScore(event.title, client.name);
    if (score > bestScore) {
      bestScore = score;
      best = client;
    }
    if (client.company_id && companiesById.has(client.company_id)) {
      const company = companiesById.get(client.company_id);
      const names = [company.trading_name, company.name].filter(Boolean);
      for (const n of names) {
        const s = matchScore(event.title, n);
        if (s > bestScore) {
          bestScore = s;
          best = client;
        }
      }
    }
  }

  return bestScore >= 60 ? best : null;
}

async function findOrCreateCompany(sb, name, userId) {
  const key = normalizeKey(name);
  const q = `%${name.trim()}%`;
  const { data: rows } = await sb
    .from('companies')
    .select('id, name, trading_name')
    .or(`name.ilike.${q},trading_name.ilike.${q}`)
    .limit(20);

  let company = (rows || []).find((c) => {
    const names = [c.trading_name, c.name].filter(Boolean).map(normalizeKey);
    return names.includes(key);
  });

  if (company) return company;

  const { data: inserted, error } = await sb
    .from('companies')
    .insert({
      name: name.trim(),
      trading_name: name.trim(),
      source: 'manual',
      created_by: userId,
    })
    .select('id, name, trading_name')
    .single();
  if (error) throw error;
  return inserted;
}

async function findOrCreateClient(sb, userId, name, companyId) {
  const { data: existing } = await sb
    .from('clients')
    .select('id, name, company_id')
    .eq('user_id', userId)
    .ilike('name', name.trim())
    .maybeSingle();
  if (existing) return existing;

  const { data: created, error } = await sb
    .from('clients')
    .insert({
      user_id: userId,
      name: name.trim(),
      client_type: 'empresa',
      company_id: companyId || null,
      profile_complete: false,
    })
    .select('id, name, company_id')
    .single();
  if (error) throw error;
  return created;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const createMissing = process.argv.includes('--create-missing');
  const env = loadEnv();
  const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const [{ data: events }, { data: clients }, { data: companies }] = await Promise.all([
    sb.from('events').select('id, user_id, title, start_date, status, client_id'),
    sb.from('clients').select('id, user_id, name, company_id'),
    sb.from('companies').select('id, name, trading_name'),
  ]);

  const companiesById = new Map((companies || []).map((c) => [c.id, c]));
  const clientsByUser = new Map();
  for (const c of clients || []) {
    if (!clientsByUser.has(c.user_id)) clientsByUser.set(c.user_id, []);
    clientsByUser.get(c.user_id).push(c);
  }

  const orphans = (events || []).filter((e) => e.status !== 'cancelled' && !e.client_id);

  console.log('\n=== Backfill: eventos → client_id ===\n');
  console.log(`Órfãos: ${orphans.length}`);
  if (dryRun) console.log('(dry-run)\n');

  let linked = 0;
  let skipped = 0;

  for (const event of orphans) {
    const userClients = clientsByUser.get(event.user_id) || [];
    const match = pickClient(event, userClients, companiesById);

    if (!match) {
      if (!createMissing || !event.title?.trim()) {
        skipped += 1;
        console.log(`  ? ${event.start_date} | ${event.title} — sem match para user ${event.user_id.slice(0, 8)}…`);
        continue;
      }

      const title = event.title.trim();
      if (dryRun) {
        console.log(`  + criaria empresa/cliente "${title}" e vincularia evento`);
        linked += 1;
        continue;
      }

      try {
        const company = await findOrCreateCompany(sb, title, event.user_id);
        const client = await findOrCreateClient(sb, event.user_id, title, company.id);
        const { error } = await sb.from('events').update({ client_id: client.id }).eq('id', event.id);
        if (error) throw error;
        linked += 1;
        console.log(`  ✓ ${event.start_date} | ${title} → criado/vinculado (${client.name})`);
      } catch (err) {
        skipped += 1;
        console.warn(`  ✗ ${title}: ${err.message}`);
      }
      continue;
    }

    if (dryRun) {
      console.log(`  → ${event.title} → ${match.name} (${match.id})`);
      linked += 1;
      continue;
    }

    const { error } = await sb.from('events').update({ client_id: match.id }).eq('id', event.id);
    if (error) {
      console.warn(`  ✗ ${event.title}: ${error.message}`);
      skipped += 1;
    } else {
      linked += 1;
      console.log(`  ✓ ${event.start_date} | ${event.title} → ${match.name}`);
    }
  }

  console.log(`\n${dryRun ? 'Simulado' : 'Concluído'}: ${linked} vinculados, ${skipped} sem match.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
