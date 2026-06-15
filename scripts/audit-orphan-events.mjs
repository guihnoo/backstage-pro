/**
 * Lista eventos sem client_id (órfãos) e client_id inválido (cliente removido).
 *
 * Uso:
 *   node scripts/audit-orphan-events.mjs
 *   node scripts/audit-orphan-events.mjs --user-id <UUID>
 *   node scripts/audit-orphan-events.mjs --json
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
    console.error('[audit] .env.local não encontrado');
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
  const asJson = process.argv.includes('--json');
  const userIdx = process.argv.indexOf('--user-id');
  const userId = userIdx !== -1 ? process.argv[userIdx + 1] : null;

  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[audit] VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  let eventsQuery = supabase
    .from('events')
    .select('id, user_id, title, start_date, end_date, status, client_id')
    .order('start_date', { ascending: false });

  let clientsQuery = supabase.from('clients').select('id, user_id, name, company');

  if (userId) {
    eventsQuery = eventsQuery.eq('user_id', userId);
    clientsQuery = clientsQuery.eq('user_id', userId);
  }

  const [{ data: events, error: evErr }, { data: clients, error: clErr }] = await Promise.all([
    eventsQuery,
    clientsQuery,
  ]);

  if (evErr) {
    console.error('[audit] Erro ao buscar eventos:', evErr.message);
    process.exit(1);
  }
  if (clErr) {
    console.error('[audit] Erro ao buscar clientes:', clErr.message);
    process.exit(1);
  }

  const clientIds = new Set((clients || []).map((c) => c.id));
  const active = (events || []).filter((e) => e.status !== 'cancelled');

  const noClientId = active.filter((e) => !e.client_id);
  const brokenClientId = active.filter((e) => e.client_id && !clientIds.has(e.client_id));

  const report = {
    totalEvents: events?.length || 0,
    activeEvents: active.length,
    withoutClientId: noClientId.length,
    brokenClientId: brokenClientId.length,
    orphans: noClientId.map((e) => ({
      id: e.id,
      title: e.title,
      start_date: e.start_date,
      status: e.status,
    })),
    broken: brokenClientId.map((e) => ({
      id: e.id,
      title: e.title,
      start_date: e.start_date,
      client_id: e.client_id,
      status: e.status,
    })),
  };

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('\n=== Auditoria: eventos sem empresa vinculada ===\n');
  console.log(`Eventos totais: ${report.totalEvents}`);
  console.log(`Ativos (não cancelados): ${report.activeEvents}`);
  console.log(`Sem client_id: ${report.withoutClientId}`);
  console.log(`client_id inválido (cliente apagado): ${report.brokenClientId}\n`);

  if (noClientId.length) {
    console.log('— Sem client_id —');
    for (const e of noClientId.slice(0, 30)) {
      console.log(`  • ${e.start_date || '?'} | ${e.title || '(sem título)'} | ${e.id}`);
    }
    if (noClientId.length > 30) console.log(`  … +${noClientId.length - 30} mais`);
    console.log('');
  }

  if (brokenClientId.length) {
    console.log('— client_id órfão —');
    for (const e of brokenClientId.slice(0, 30)) {
      console.log(`  • ${e.start_date || '?'} | ${e.title || '(sem título)'} | client=${e.client_id}`);
    }
    if (brokenClientId.length > 30) console.log(`  … +${brokenClientId.length - 30} mais`);
  }

  if (!noClientId.length && !brokenClientId.length) {
    console.log('Nenhum evento ativo sem vínculo de cliente. ✓');
  }

  console.log('\nDica: vincule o cliente na Agenda (editar evento → Cliente).\n');
}

main().catch((err) => {
  console.error('[audit] Falha:', err);
  process.exit(1);
});
