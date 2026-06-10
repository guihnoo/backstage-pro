#!/usr/bin/env node
/**
 * Backup automático: stage seguro → commit WIP → push.
 * Disparado pelo hook Cursor (stop/sessionEnd) ou via `npm run git:backup`.
 *
 * Pausar: criar arquivo vazio `.cursor/PAUSE_AUTO_GIT`
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PAUSE_FILE = path.join(ROOT, '.cursor', 'PAUSE_AUTO_GIT');
const DEBOUNCE_FILE = path.join(ROOT, '.cursor', '.last-auto-git');
const MIN_INTERVAL_MS = 2 * 60 * 1000;

const UNTRACKED_IGNORE = [
  'playwright-report',
  'test-results',
  'node_modules',
  'dist',
  '.vercel',
  '.tools',
];

const RESET_PATHS = [
  '.env',
  '.env.local',
  '.env.vercel',
  '.env.vercel.*',
  'client_secret',
  'client_secret_*.json',
  'playwright-report',
  'test-results',
  'node_modules',
  'dist',
  '.vercel',
];

function log(message) {
  process.stderr.write(`[auto-git] ${message}\n`);
}

function run(command, args = []) {
  return spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function git(...args) {
  return run('git', args);
}

function isPaused() {
  return fs.existsSync(PAUSE_FILE);
}

function isDebounced() {
  if (!fs.existsSync(DEBOUNCE_FILE)) return false;
  const last = Number(fs.readFileSync(DEBOUNCE_FILE, 'utf8').trim());
  if (!Number.isFinite(last)) return false;
  return Date.now() - last < MIN_INTERVAL_MS;
}

function markDebounced() {
  fs.mkdirSync(path.dirname(DEBOUNCE_FILE), { recursive: true });
  fs.writeFileSync(DEBOUNCE_FILE, String(Date.now()));
}

function hasGitRepo() {
  const result = git('rev-parse', '--git-dir');
  return result.status === 0;
}

function hasChanges() {
  const result = git('status', '--porcelain');
  return result.status === 0 && Boolean(result.stdout.trim());
}

function ignoreUntrackedNoise() {
  for (const entry of UNTRACKED_IGNORE) {
    const full = path.join(ROOT, entry);
    if (!fs.existsSync(full)) continue;
    const relative = path.relative(ROOT, full).split(path.sep).join('/');
    git('update-index', '--assume-unchanged', '--', relative);
  }
}

function stageSafeChanges() {
  git('add', '-A');

  for (const pattern of RESET_PATHS) {
    git('reset', '-q', '--', pattern);
  }

  const staged = git('diff', '--cached', '--name-only');
  if (staged.status !== 0) return false;

  const files = staged.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const blocked = files.filter(
    (file) =>
      file.startsWith('.env') ||
      file.includes('client_secret') ||
      file.startsWith('playwright-report/') ||
      file.startsWith('test-results/'),
  );

  if (blocked.length > 0) {
    git('reset', '-q', '--', ...blocked);
  }

  const after = git('diff', '--cached', '--name-only');
  return after.status === 0 && Boolean(after.stdout.trim());
}

function commitWip() {
  const timestamp = new Date()
    .toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    .replace(',', '');
  const message = `chore(auto): wip backup ${timestamp}`;
  return git('commit', '-m', message);
}

function pushIfPossible() {
  const branch = git('branch', '--show-current');
  if (branch.status !== 0 || !branch.stdout.trim()) return { ok: false, reason: 'sem branch' };

  const upstream = git('rev-parse', '--abbrev-ref', `${branch.stdout.trim()}@{upstream}`);
  if (upstream.status !== 0) {
    const push = git('push', '-u', 'origin', branch.stdout.trim());
    return { ok: push.status === 0, stderr: push.stderr, stdout: push.stdout };
  }

  const push = git('push');
  return { ok: push.status === 0, stderr: push.stderr, stdout: push.stdout };
}

function main() {
  if (isPaused()) {
    log('pausado (.cursor/PAUSE_AUTO_GIT existe)');
    process.exit(0);
  }

  if (isDebounced()) {
    log('ignorado (debounce 2min)');
    process.exit(0);
  }

  if (!hasGitRepo()) {
    log('não é repositório git');
    process.exit(0);
  }

  if (!hasChanges()) {
    log('nada para salvar');
    process.exit(0);
  }

  ignoreUntrackedNoise();

  if (!stageSafeChanges()) {
    log('nenhum arquivo seguro para commit');
    process.exit(0);
  }

  const commit = commitWip();
  if (commit.status !== 0) {
    log(`commit falhou: ${(commit.stderr || commit.stdout || '').trim()}`);
    process.exit(0);
  }

  markDebounced();

  const push = pushIfPossible();
  if (push.ok) {
    log('commit + push ok');
  } else {
    log(`commit ok; push falhou: ${(push.stderr || push.reason || '').trim()}`);
  }

  process.exit(0);
}

main();
