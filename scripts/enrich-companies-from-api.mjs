/**
 * Enriquece empresas esparsas no catálogo global via busca por nome (CNPJa).
 * Preenche apenas campos vazios (cnpj, cidade, logo Clearbit, etc.).
 *
 * Uso:
 *   node scripts/enrich-companies-from-api.mjs --dry-run
 *   node scripts/enrich-companies-from-api.mjs
 *   node scripts/enrich-companies-from-api.mjs --id=<company-uuid> --dry-run
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
    console.error('[enrich-companies] .env.local não encontrado');
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

function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function cleanCNPJ(s) {
  return String(s || '').replace(/\D/g, '');
}

function extractDomain(email, website) {
  if (website) {
    try {
      const u = new URL(website.startsWith('http') ? website : `https://${website}`);
      return u.hostname.replace(/^www\./, '');
    } catch {
      /* ignore */
    }
  }
  if (email) {
    const parts = email.split('@');
    if (parts.length === 2) return parts[1].toLowerCase().trim();
  }
  return null;
}

function logoUrl(domain) {
  return domain ? `https://logo.clearbit.com/${domain}` : null;
}

function mapCnpjaSearch(item) {
  const addr = item.address || {};
  const company = item.company || {};
  const cnpj = cleanCNPJ(item.taxId || item.cnpj || '');
  const name = String(item.alias || company.name || item.name || '');
  const razao = String(company.name || name);
  const city = String(addr.city?.name || addr.municipality || '');
  const state = String(addr.state || '');
  const phones = item.phones || [];
  const emails = item.emails || [];
  const phone = phones[0] ? `(${phones[0].area}) ${phones[0].number}` : null;
  const email = String(emails[0]?.address || '') || null;
  const site = String(item.website || '') || null;
  const domain = extractDomain(email, site);
  const cnae =
    (item.activities || []).find((a) => a.isMain)?.text || '';
  const porte = company.size?.text || '';

  return {
    cnpj: cnpj || null,
    name: name || razao,
    trading_name: name && name !== razao ? name : null,
    city,
    state,
    phone,
    email,
    website: site || null,
    logo_url: logoUrl(domain),
    cnae: cnae || null,
    porte: porte || null,
    source: 'cnpja',
    verified: true,
  };
}

async function searchByName(query) {
  const q = encodeURIComponent(stripAccents(query.trim()).toUpperCase());
  const url = `https://open.cnpja.com/company/search?query=${q}&limit=10`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) return [];
  const d = await r.json();
  const items = d.companies || d.data || (Array.isArray(d) ? d : []);
  return items.map(mapCnpjaSearch);
}

function pickBestMatch(company, results) {
  const key = normalizeKey(company.trading_name || company.name);
  if (!key || !results.length) return null;

  const exact = results.find((r) => {
    const names = [r.trading_name, r.name].filter(Boolean).map(normalizeKey);
    return names.includes(key);
  });
  if (exact) return exact;

  const partial = results.find((r) => {
    const names = [r.trading_name, r.name].filter(Boolean).map(normalizeKey);
    return names.some((n) => n.includes(key) || key.includes(n));
  });
  return partial || null;
}

function buildPatch(existing, incoming) {
  const patch = {};
  const fields = [
    'trading_name',
    'city',
    'state',
    'phone',
    'email',
    'website',
    'logo_url',
    'cnae',
    'porte',
    'cnpj',
  ];

  for (const field of fields) {
    const value = incoming[field];
    if (value == null || value === '') continue;
    if (!existing[field]) patch[field] = value;
  }

  if (!existing.name?.trim() && incoming.name?.trim()) patch.name = incoming.name.trim();
  if (Object.keys(patch).length === 0) return null;

  patch.verified = true;
  patch.source = incoming.source || 'cnpja';
  return patch;
}

function displayName(c) {
  return c.trading_name || c.name || '(sem nome)';
}

function parseArg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const onlyId = parseArg('id');
  const env = loadEnv();
  const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  let query = sb
    .from('companies')
    .select('*')
    .eq('verified', false)
    .order('name');

  if (onlyId) query = query.eq('id', onlyId);

  const { data: companies, error } = await query;
  if (error) {
    console.error('[enrich-companies] Erro:', error.message);
    process.exit(1);
  }

  const sparse = (companies || []).filter(
    (c) => !c.cnpj || !c.logo_url || !c.city,
  );

  console.log('\n=== Enriquecimento: catálogo via CNPJa ===\n');
  console.log(`Candidatas (não verificadas / incompletas): ${sparse.length}`);
  if (dryRun) console.log('(modo dry-run — nenhuma escrita)\n');

  let enriched = 0;
  let skipped = 0;

  for (const co of sparse) {
    const label = displayName(co);
    process.stdout.write(`  • ${label}… `);

    const results = await searchByName(co.trading_name || co.name);
    const match = pickBestMatch(co, results);

    if (!match) {
      console.log('sem match na Receita (UI usa inicial colorida)');
      skipped += 1;
      continue;
    }

    const patch = buildPatch(co, match);
    if (!patch) {
      console.log('match encontrado, mas nada novo para preencher');
      skipped += 1;
      continue;
    }

    console.log(
      `match → ${match.name}${patch.cnpj ? ` | CNPJ ${patch.cnpj}` : ''}${patch.logo_url ? ' | logo' : ''}`,
    );

    if (!dryRun) {
      const { error: upErr } = await sb.from('companies').update(patch).eq('id', co.id);
      if (upErr) {
        console.error(`    ✗ ${upErr.message}`);
        skipped += 1;
        continue;
      }
    }
    enriched += 1;
  }

  console.log(
    `\n${dryRun ? 'Seriam enriquecidas' : 'Enriquecidas'}: ${enriched} | Sem match/dados: ${skipped}\n`,
  );
}

main().catch((err) => {
  console.error('[enrich-companies] Falha:', err);
  process.exit(1);
});
