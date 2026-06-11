#!/usr/bin/env node
/**
 * Grava service_role_key no Vault e aplica cron de push (migration 027).
 * Lê SUPABASE_SERVICE_ROLE_KEY de .env.local (não commitar).
 */
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');

function loadServiceRoleKey() {
  const raw = readFileSync(envPath, 'utf8');
  const match = raw.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m);
  if (!match) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente em .env.local');
  return match[1].trim().replace(/^["']|["']$/g, '');
}

const key = loadServiceRoleKey();
const sql = `
delete from vault.secrets where name = 'service_role_key';
select vault.create_secret('${key.replace(/'/g, "''")}', 'service_role_key', 'Backstage push cron');
`;

const tmp = join(root, '.tmp-vault-setup.sql');
writeFileSync(tmp, sql, 'utf8');
try {
  execSync(`npx supabase db query --linked -f "${tmp}"`, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  console.log('Vault secret service_role_key configurado.');
} finally {
  try { unlinkSync(tmp); } catch { /* ignore */ }
}
