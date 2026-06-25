/**
 * Grava o filme promocional cinematográfico (promo-film.html).
 * Narrativa + motion design + screenshots reais — não tour robótico de telas.
 *
 * Uso: node marketing/instagram-stories/record-promo-film.mjs
 */
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'export-real');
const FILM_HTML = path.join(OUT_DIR, 'promo-film.html');
const OUT_WEBM = path.join(OUT_DIR, 'backstage-pro-promo.webm');
const OUT_MP4 = path.join(OUT_DIR, 'backstage-pro-promo.mp4');
const VIEWPORT = { width: 1080, height: 1920 };
const FILM_DURATION_MS = 52_000;

const REQUIRED_IMAGES = [
  '01-login.png', '02-home.png', '03-agenda.png',
  '04-clientes.png', '06-relatorios.png', '08-ia-mentor.png', '09-cta.png',
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function checkAssets() {
  if (!fs.existsSync(FILM_HTML)) {
    throw new Error('promo-film.html não encontrado. Rode capture-real.mjs primeiro.');
  }
  for (const img of REQUIRED_IMAGES) {
    if (!fs.existsSync(path.join(OUT_DIR, img))) {
      throw new Error(`Imagem ausente: ${img}. Rode: node marketing/instagram-stories/capture-real.mjs`);
    }
  }
}

function findWebmInDir(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.webm'));
  return files.length ? path.join(dir, files[0]) : null;
}

async function tryConvertMp4(webmPath) {
  const { spawn } = await import('child_process');
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', [
      '-y', '-i', webmPath,
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      OUT_MP4,
    ], { shell: true });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

async function main() {
  checkAssets();

  const videoTemp = path.join(os.tmpdir(), 'backstage-pro-film-' + Date.now());
  fs.mkdirSync(videoTemp, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: { dir: videoTemp, size: { width: 1080, height: 1920 } },
  });
  const page = await context.newPage();

  const fileUrl = `file:///${FILM_HTML.replace(/\\/g, '/')}`;
  console.log('→ Gravando filme promocional (~52s narrativa)...');
  await page.goto(fileUrl, { waitUntil: 'load' });
  await sleep(FILM_DURATION_MS + 800);

  await page.close();
  await context.close();
  await browser.close();

  const recorded = findWebmInDir(videoTemp);
  if (!recorded) throw new Error('Vídeo não gravado em _film-temp');

  fs.copyFileSync(recorded, OUT_WEBM);
  console.log(`✓ ${OUT_WEBM}`);

  try { fs.rmSync(videoTemp, { recursive: true, force: true }); } catch { /* ignore */ }

  const mp4Ok = await tryConvertMp4(OUT_WEBM);
  if (mp4Ok) {
    console.log(`✓ ${OUT_MP4} (pronto para Instagram)`);
  } else {
    console.log('→ ffmpeg não disponível — use CapCut para converter webm → mp4');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
