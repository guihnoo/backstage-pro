#!/usr/bin/env node
/**
 * Gera PNGs do PWA a partir dos SVGs em public/.
 * Requer: npm i -D sharp (devDependency)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

const TARGETS = [
  { src: 'icon.svg', out: 'icon-192x192.png', size: 192 },
  { src: 'icon.svg', out: 'icon-512x512.png', size: 512 },
  { src: 'icon-maskable.svg', out: 'icon-maskable-512.png', size: 512 },
  { src: 'icon.svg', out: 'apple-touch-icon.png', size: 180 },
];

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Instale sharp: npm i -D sharp');
    process.exit(1);
  }

  for (const { src, out, size } of TARGETS) {
    const svg = await readFile(join(publicDir, src));
    const png = await sharp(svg).resize(size, size).png().toBuffer();
    await writeFile(join(publicDir, out), png);
    console.log(`✓ ${out} (${size}×${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
