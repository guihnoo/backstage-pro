/**
 * Auditoria do catálogo global `companies` e vínculos em `clients`.
 *
 * Uso:
 *   node scripts/audit-companies.mjs
 *   node scripts/audit-companies.mjs --json
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
    console.error('[audit-companies] .env.local não encontrado');
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
  const asJson = process.argv.includes('--json');
  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[audit-companies] VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
    process.exit(1);
  }

  const sb = createClient(url, key);

  const [{ data: companies, error: coErr }, { data: clients, error: clErr }] = await Promise.all([
    sb.from('companies').select('id, name, trading_name, logo_url, verified, source, cnpj, city, state').order('name'),
    sb.from('clients').select('id, name, client_type, company_id, logo_url, user_id'),
  ]);

  if (coErr) {
    console.error('[audit-companies] Erro ao ler companies:', coErr.message);
    process.exit(1);
  }
  if (clErr) {
    console.error('[audit-companies] Erro ao ler clients:', clErr.message);
    process.exit(1);
  }

  const companyRows = companies || [];
  const clientRows = clients || [];
  const empresaClients = clientRows.filter((c) => c.client_type !== 'pessoa');

  const withLogo = companyRows.filter((c) => c.logo_url);
  const withoutLogo = companyRows.filter((c) => !c.logo_url);
  const verified = companyRows.filter((c) => c.verified);
  const clientsLinked = empresaClients.filter((c) => c.company_id);
  const clientsUnlinked = empresaClients.filter((c) => !c.company_id);

  const clientsByCompany = new Map();
  for (const c of clientsLinked) {
    clientsByCompany.set(c.company_id, (clientsByCompany.get(c.company_id) || 0) + 1);
  }

  const orphanCompanies = companyRows.filter((c) => !clientsByCompany.has(c.id));

  const report = {
    companiesTotal: companyRows.length,
    withLogo: withLogo.length,
    withoutLogo: withoutLogo.length,
    verified: verified.length,
    empresaClientsTotal: empresaClients.length,
    clientsWithCompanyId: clientsLinked.length,
    clientsWithoutCompanyId: clientsUnlinked.length,
    companiesWithoutClients: orphanCompanies.length,
    withoutLogoList: withoutLogo.map((c) => ({
      id: c.id,
      name: displayName(c),
      clients: clientsByCompany.get(c.id) || 0,
    })),
    catalog: companyRows.map((c) => ({
      id: c.id,
      name: displayName(c),
      logo: Boolean(c.logo_url),
      verified: Boolean(c.verified),
      source: c.source,
      clients: clientsByCompany.get(c.id) || 0,
    })),
  };

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('\n=== Auditoria: catálogo global de empresas ===\n');
  console.log(`Empresas no catálogo: ${report.companiesTotal}`);
  console.log(`  Com logo: ${report.withLogo}`);
  console.log(`  Sem logo: ${report.withoutLogo}`);
  console.log(`  Verificadas (Receita): ${report.verified}`);
  console.log(`  Sem nenhum client vinculado: ${report.companiesWithoutClients}\n`);

  console.log(`Clients tipo empresa: ${report.empresaClientsTotal}`);
  console.log(`  Com company_id: ${report.clientsWithCompanyId}`);
  console.log(`  Sem company_id: ${report.clientsWithoutCompanyId}\n`);

  if (companyRows.length) {
    console.log('— Catálogo —');
    for (const c of companyRows) {
      const logo = c.logo_url ? 'logo ✓' : 'sem logo';
      const linked = clientsByCompany.get(c.id) || 0;
      console.log(`  • ${displayName(c)} | ${logo} | ${linked} client(s) | ${c.source || '?'}`);
    }
    console.log('');
  }

  if (withoutLogo.length) {
    console.log('— Sem logo (candidatas a enriquecimento) —');
    for (const c of withoutLogo) {
      console.log(`  • ${displayName(c)} (${c.id})`);
    }
    console.log('Dica: pnpm db:backfill-company-logos (clients) ou pnpm db:enrich-companies (Receita/CNPJa).');
    console.log('Sem logo na API? O app exibe inicial colorida (CompanyAvatar).\n');
  } else if (!clientsUnlinked.length) {
    console.log('Catálogo e vínculos OK. ✓\n');
  }

  if (clientsUnlinked.length) {
    console.log('— Clients empresa sem company_id —');
    for (const c of clientsUnlinked.slice(0, 20)) {
      console.log(`  • ${c.name} | user=${c.user_id?.slice(0, 8)}…`);
    }
    if (clientsUnlinked.length > 20) console.log(`  … +${clientsUnlinked.length - 20} mais`);
    console.log('\nDica: pnpm db:backfill-companies\n');
  }
}

main().catch((err) => {
  console.error('[audit-companies] Falha:', err);
  process.exit(1);
});
