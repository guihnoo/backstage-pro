/**
 * Seed de dados de demonstração para um usuário específico.
 * Uso: node scripts/seed-demo-user.mjs --user-id <UUID>
 *
 * Requer em .env.local:
 *   VITE_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...   (preferencial — ignora RLS)
 *   VITE_SUPABASE_ANON_KEY=...      (fallback — exige RLS desabilitada)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');

// Lê .env.local
function loadEnv() {
  const envPath = resolve(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('[seed] Arquivo .env.local não encontrado em:', envPath);
    process.exit(1);
  }
  const lines = readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    env[key.trim()] = rest.join('=').trim();
  }
  return env;
}

// Lê user-id de argv
function getUserId() {
  const idx = process.argv.indexOf('--user-id');
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  // Tenta primeiro argumento posicional
  const positional = process.argv[2];
  if (positional && !positional.startsWith('--') && positional.length === 36) return positional;
  return null;
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env['VITE_SUPABASE_URL'];
  const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'];
  const anonKey = env['VITE_SUPABASE_ANON_KEY'];
  const key = serviceKey || anonKey;

  if (!supabaseUrl || !key) {
    console.error('[seed] VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou VITE_SUPABASE_ANON_KEY) são obrigatórios no .env.local');
    process.exit(1);
  }

  if (!serviceKey) {
    console.warn('[seed] Aviso: usando VITE_SUPABASE_ANON_KEY — inserts podem falhar se RLS estiver ativa.');
  }

  const userId = getUserId();
  if (!userId) {
    console.error('[seed] Informe o user_id: node scripts/seed-demo-user.mjs --user-id <UUID>');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`\n[seed] Iniciando seed para user_id: ${userId}`);

  // ----- Clientes -----
  const demoClients = [
    { name: 'Demo Produtora X', default_daily_cache: 800, city: 'São Paulo', state: 'SP' },
    { name: 'Demo Agência Y', default_daily_cache: 1200, city: 'Rio de Janeiro', state: 'RJ' },
  ];

  // Idempotência: verifica se já existem
  const { data: existing } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', userId)
    .in('name', demoClients.map((c) => c.name));

  const existingNames = new Set((existing || []).map((c) => c.name));

  let insertedClients = existing || [];
  const toInsert = demoClients.filter((c) => !existingNames.has(c.name));

  if (toInsert.length > 0) {
    const { data: created, error } = await supabase
      .from('clients')
      .insert(toInsert.map((c) => ({ ...c, user_id: userId })))
      .select();

    if (error) {
      console.error('[seed] Erro ao inserir clientes:', error.message);
      process.exit(1);
    }
    insertedClients = [...insertedClients, ...(created || [])];
    console.log(`[seed] Clientes criados: ${created?.map((c) => c.name).join(', ')}`);
  } else {
    console.log('[seed] Clientes demo já existem — pulando criação.');
  }

  const clientX = insertedClients.find((c) => c.name === 'Demo Produtora X');
  const clientY = insertedClients.find((c) => c.name === 'Demo Agência Y');

  // ----- Eventos -----
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const dayOffset = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

  const demoEvents = [
    {
      title: 'Demo Gravação X',
      client_id: clientX?.id || null,
      start_date: fmt(dayOffset(7)),
      end_date: fmt(dayOffset(8)),
      daily_cache_value: 700,
      status: 'confirmed',
      user_id: userId,
      location: 'Estúdio Demo, São Paulo, SP',
      location_city: 'São Paulo',
      location_state: 'SP',
      location_lat: -23.5505,
      location_lng: -46.6333,
    },
    {
      title: 'Demo Campanha Y',
      client_id: clientY?.id || null,
      start_date: fmt(dayOffset(14)),
      end_date: fmt(dayOffset(15)),
      daily_cache_value: 1500,
      status: 'pending',
      user_id: userId,
      location: 'Arena Demo, Rio de Janeiro, RJ',
      location_city: 'Rio de Janeiro',
      location_state: 'RJ',
      location_lat: -22.9068,
      location_lng: -43.1729,
    },
  ];

  const { data: existingEvents } = await supabase
    .from('events')
    .select('id, title')
    .eq('user_id', userId)
    .in('title', demoEvents.map((e) => e.title));

  const existingEventNames = new Set((existingEvents || []).map((e) => e.title));
  const eventsToInsert = demoEvents.filter((e) => !existingEventNames.has(e.title));

  let insertedEvents = existingEvents || [];

  if (eventsToInsert.length > 0) {
    const { data: createdEvents, error } = await supabase
      .from('events')
      .insert(eventsToInsert)
      .select();

    if (error) {
      console.error('[seed] Erro ao inserir eventos:', error.message);
      process.exit(1);
    }
    insertedEvents = [...insertedEvents, ...(createdEvents || [])];
    console.log(`[seed] Eventos criados: ${createdEvents?.map((e) => e.title).join(', ')}`);
  } else {
    console.log('[seed] Eventos demo já existem — pulando criação.');
  }

  const locationPatches = [
    {
      title: 'Demo Gravação X',
      location: 'Estúdio Demo, São Paulo, SP',
      location_city: 'São Paulo',
      location_state: 'SP',
      location_lat: -23.5505,
      location_lng: -46.6333,
    },
    {
      title: 'Demo Campanha Y',
      location: 'Arena Demo, Rio de Janeiro, RJ',
      location_city: 'Rio de Janeiro',
      location_state: 'RJ',
      location_lat: -22.9068,
      location_lng: -43.1729,
    },
  ];

  for (const patch of locationPatches) {
    const row = insertedEvents.find((e) => e.title === patch.title);
    if (!row?.id) continue;
    const { title, ...fields } = patch;
    const { error: locErr } = await supabase
      .from('events')
      .update(fields)
      .eq('id', row.id)
      .eq('user_id', userId);
    if (locErr) {
      console.warn(`[seed] Aviso: não foi possível atualizar local de "${title}":`, locErr.message);
    }
  }

  // ----- Daily Work -----
  const eventX = insertedEvents.find((e) => e.title === 'Demo Gravação X');

  if (eventX) {
    const workDate = fmt(dayOffset(7));

    const { data: existingWork } = await supabase
      .from('daily_work')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventX.id)
      .eq('date', workDate);

    if ((existingWork || []).length === 0) {
      const { error } = await supabase.from('daily_work').insert({
        user_id: userId,
        event_id: eventX.id,
        date: workDate,
        total_hours: 10,
        daily_cache: 700,
        status: 'completed',
      });

      if (error) {
        console.error('[seed] Erro ao inserir daily_work:', error.message);
        process.exit(1);
      }
      console.log(`[seed] Daily work criado para evento "${eventX.title}" em ${workDate}`);
    } else {
      console.log('[seed] Daily work demo já existe — pulando criação.');
    }
  }

  console.log('\n[seed] Seed de demonstração concluído com sucesso!\n');
}

main().catch((err) => {
  console.error('[seed] Erro inesperado:', err);
  process.exit(1);
});
