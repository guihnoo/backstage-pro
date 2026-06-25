/**
 * Exporta slides do stories.html como PNG 1080×1920 para Instagram Stories.
 * Uso: node marketing/instagram-stories/export-stories.mjs
 */
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'stories.html');
const outDir = path.join(__dirname, 'export');

const SLIDES = [
  { id: 'slide-1', name: '01-capa' },
  { id: 'slide-2', name: '02-agenda' },
  { id: 'slide-3', name: '03-modo-palco' },
  { id: 'slide-4', name: '04-financeiro' },
  { id: 'slide-5', name: '05-clientes' },
  { id: 'slide-6', name: '06-ia-mentor' },
  { id: 'slide-7', name: '07-fechamento' },
  { id: 'slide-8', name: '08-cta' },
];

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
});

const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
await page.goto(fileUrl, { waitUntil: 'networkidle' });

for (const slide of SLIDES) {
  const el = page.locator(`#${slide.id}`);
  await el.scrollIntoViewIfNeeded();
  const outFile = path.join(outDir, `${slide.name}.png`);
  await el.screenshot({ path: outFile, type: 'png' });
  console.log(`✓ ${outFile}`);
}

await browser.close();
console.log(`\n${SLIDES.length} imagens exportadas em: ${outDir}`);
