/**
 * Captura screenshots REAIS do app (Playwright + dados demo) e gera:
 * - export-real/*.png — telas autênticas 1080×1920
 * - export-real/carousel.html — carrossel interativo
 * - export-real/backstage-pro-promo.webm — vídeo demo (~45s)
 *
 * Uso: node marketing/instagram-stories/capture-real.mjs
 */
import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'export-real');
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const VIEWPORT = { width: 1080, height: 1920 };

const SLIDES = [
  {
    id: '01-login',
    route: '/login',
    public: true,
    caption: 'Entrada premium',
    waitText: /Entrar|Google|Backstage/i,
  },
  {
    id: '02-home',
    route: '/',
    caption: 'Cockpit do seu dia',
    waitText: /Palco|Financeiro|Ricardo|Bom dia|Boa/i,
    scroll: 400,
  },
  {
    id: '03-agenda',
    route: '/calendar',
    caption: 'Agenda visual',
    waitText: /Agenda|Grid|Junho|Semana/i,
  },
  {
    id: '04-clientes',
    route: '/clients',
    caption: 'CRM de clientes',
    waitText: /Live Nation|Festival|Clientes/i,
  },
  {
    id: '05-metas',
    route: '/goals',
    caption: 'Metas e ritmo',
    waitText: /Meta|Receita|shows/i,
  },
  {
    id: '06-relatorios',
    route: '/reports',
    caption: 'Relatórios + mapa',
    waitText: /Relatório|Receita|Brasil/i,
    scroll: 300,
  },
  {
    id: '07-despesas',
    route: '/expenses',
    caption: 'Despesas por evento',
    waitText: /Despesas|Este mês/i,
  },
  {
    id: '08-ia-mentor',
    route: '/ai-mentor',
    caption: 'IA Mentor',
    waitText: /Mentor|iluminação|bastidor/i,
  },
  {
    id: '09-cta',
    route: '/profile',
    caption: 'Instale como app',
    waitText: /Perfil|Ricardo|Este mês/i,
  },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function isServerUp() {
  return new Promise((resolve) => {
    const req = http.get(BASE, (res) => {
      res.resume();
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startDevServer() {
  if (await isServerUp()) {
    console.log('→ Dev server já rodando em', BASE);
    return null;
  }

  console.log('→ Iniciando dev server…');
  const child = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: path.join(__dirname, '../../'),
    shell: true,
    stdio: 'pipe',
  });

  for (let i = 0; i < 60; i++) {
    if (await isServerUp()) {
      console.log('→ Dev server pronto');
      return child;
    }
    await sleep(2000);
  }

  child.kill();
  throw new Error('Dev server não iniciou em 120s');
}

async function waitForReady(page, pattern, timeout = 45_000) {
  await page.waitForLoadState('domcontentloaded');
  try {
    await page.getByText(pattern).first().waitFor({ state: 'visible', timeout });
  } catch {
  }
  await page.waitForFunction(
    () => document.querySelectorAll('[data-slot="skeleton"], .animate-pulse').length < 2,
    { timeout: 15_000 }
  ).catch(() => {});
  await sleep(1200);
}

async function captureSlide(page, slide) {
  const { seedMarketingSession } = await import('./marketingMocks.js');
  const { disableServiceWorkerForE2E } = await import('../../e2e/helpers/fakeAuth.js');

  if (slide.public) {
    await disableServiceWorkerForE2E(page);
    await page.goto(slide.route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  } else {
    await seedMarketingSession(page);
    await page.goto(slide.route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  }

  await waitForReady(page, slide.waitText);

  if (slide.scroll) {
    await page.evaluate((y) => {
      const main = document.querySelector('main[data-app-scroll]');
      if (main) main.scrollTop = y;
    }, slide.scroll);
    await sleep(600);
  }

  const outFile = path.join(OUT_DIR, `${slide.id}.png`);
  await page.screenshot({ path: outFile, type: 'png', fullPage: false });
  console.log(`✓ ${outFile}`);
  return { ...slide, file: `${slide.id}.png` };
}

function buildCarouselHtml(captured) {
  const slidesJson = JSON.stringify(
    captured.map((s) => ({
      src: s.file,
      caption: s.caption,
      id: s.id,
    }))
  );

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Backstage Pro — Carrossel Instagram</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #050609; color: #fff; font-family: system-ui, sans-serif; overflow: hidden; }
    .app { height: 100%; display: flex; flex-direction: column; max-width: 480px; margin: 0 auto; }
    .header {
      padding: 16px 20px 8px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid rgba(166,74,255,0.2);
    }
    .brand { font-weight: 800; font-size: 14px; letter-spacing: 0.08em;
      background: linear-gradient(135deg, #C77DFF, #FFB700);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .counter { font-size: 13px; color: rgba(255,255,255,0.45); }
    .stage {
      flex: 1; position: relative; display: flex; align-items: center; justify-content: center;
      padding: 12px 16px; min-height: 0;
    }
    .slide-wrap {
      position: relative; width: 100%; aspect-ratio: 9/16; max-height: 100%;
      border-radius: 20px; overflow: hidden;
      box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(166,74,255,0.12);
      border: 1px solid rgba(166,74,255,0.25);
    }
    .slide-wrap img {
      width: 100%; height: 100%; object-fit: cover; object-position: top center;
      display: block; transition: opacity 0.35s ease;
    }
    .caption {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 20px 20px 24px;
      background: linear-gradient(transparent, rgba(5,6,9,0.92));
      font-size: 18px; font-weight: 700;
    }
    .dots { display: flex; gap: 6px; justify-content: center; padding: 12px; }
    .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: rgba(255,255,255,0.2); transition: all 0.25s;
    }
    .dot.active { width: 24px; border-radius: 4px; background: #A64AFF; }
    .controls {
      display: flex; gap: 12px; padding: 8px 20px 20px; justify-content: center;
    }
    button {
      padding: 14px 28px; border-radius: 14px; border: none; cursor: pointer;
      font-size: 15px; font-weight: 700;
    }
    .btn-prev, .btn-next { background: rgba(255,255,255,0.08); color: #fff; }
    .btn-auto { background: linear-gradient(135deg, #A64AFF, #7c3aed); color: #fff; flex: 1; max-width: 200px; }
    .hint { text-align: center; font-size: 11px; color: rgba(255,255,255,0.35); padding-bottom: 12px; }
    @media (min-width: 900px) {
      .app { max-width: 420px; }
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="header">
      <span class="brand">BACKSTAGE PRO</span>
      <span class="counter" id="counter">1 / ${captured.length}</span>
    </div>
    <div class="stage">
      <div class="slide-wrap">
        <img id="slide-img" alt="Backstage Pro" />
        <div class="caption" id="caption"></div>
      </div>
    </div>
    <div class="dots" id="dots"></div>
    <div class="controls">
      <button type="button" class="btn-prev" id="prev">←</button>
      <button type="button" class="btn-auto" id="auto">▶ Auto</button>
      <button type="button" class="btn-next" id="next">→</button>
    </div>
    <p class="hint">Deslize · clique nas setas · ou use Auto para preview do carrossel</p>
  </div>
  <script>
    const SLIDES = ${slidesJson};
    let idx = 0;
    let timer = null;
    const img = document.getElementById('slide-img');
    const caption = document.getElementById('caption');
    const counter = document.getElementById('counter');
    const dotsEl = document.getElementById('dots');

    SLIDES.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => go(i));
      dotsEl.appendChild(d);
    });

    function go(i) {
      idx = (i + SLIDES.length) % SLIDES.length;
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = SLIDES[idx].src;
        img.style.opacity = '1';
        caption.textContent = SLIDES[idx].caption;
        counter.textContent = (idx + 1) + ' / ' + SLIDES.length;
        dotsEl.querySelectorAll('.dot').forEach((d, j) => d.classList.toggle('active', j === idx));
      }, 150);
    }

    function toggleAuto() {
      const btn = document.getElementById('auto');
      if (timer) {
        clearInterval(timer);
        timer = null;
        btn.textContent = '▶ Auto';
        return;
      }
      btn.textContent = '⏸ Pausar';
      timer = setInterval(() => go(idx + 1), 3500);
    }

    document.getElementById('prev').onclick = () => go(idx - 1);
    document.getElementById('next').onclick = () => go(idx + 1);
    document.getElementById('auto').onclick = toggleAuto;

    let touchX = 0;
    document.querySelector('.slide-wrap').addEventListener('touchstart', e => touchX = e.touches[0].clientX);
    document.querySelector('.slide-wrap').addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (dx > 50) go(idx - 1);
      if (dx < -50) go(idx + 1);
    });

    go(0);
  </script>
</body>
</html>`;
}

async function recordPromoVideo(browser, baseUrl) {
  const videoDir = path.join(OUT_DIR, '_video-temp');
  fs.mkdirSync(videoDir, { recursive: true });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    baseURL: baseUrl,
    recordVideo: { dir: videoDir, size: { width: 1080, height: 1920 } },
  });
  const page = await context.newPage();
  const { seedMarketingSession } = await import('./marketingMocks.js');
  const { disableServiceWorkerForE2E } = await import('../../e2e/helpers/fakeAuth.js');

  await disableServiceWorkerForE2E(page);
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await sleep(2500);

  await seedMarketingSession(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForReady(page, /Palco|Financeiro|Ricardo/i);
  await sleep(2000);

  const main = page.locator('main[data-app-scroll]');
  await main.evaluate((el) => { el.scrollTop = 350; });
  await sleep(1500);
  await main.evaluate((el) => { el.scrollTop = 0; });
  await sleep(800);

  const navRoutes = [
    { path: '/calendar', wait: /Agenda|Grid|Junho/i },
    { path: '/clients', wait: /Live Nation|Clientes/i },
    { path: '/goals', wait: /Meta|Receita/i },
    { path: '/reports', wait: /Relatório|Brasil/i },
    { path: '/expenses', wait: /Despesas/i },
    { path: '/ai-mentor', wait: /Mentor/i },
    { path: '/profile', wait: /Perfil|Ricardo/i },
  ];

  for (const nav of navRoutes) {
    await page.goto(nav.path, { waitUntil: 'domcontentloaded' });
    await waitForReady(page, nav.wait);
    await sleep(2200);
  }

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForReady(page, /Palco|Financeiro/i);
  await sleep(2000);

  const video = page.video();
  await context.close();

  if (!video) return null;

  const webmPath = path.join(OUT_DIR, 'backstage-pro-promo.webm');
  await video.saveAs(webmPath);

  fs.rmSync(videoDir, { recursive: true, force: true });
  console.log(`✓ ${webmPath}`);
  return webmPath;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const devChild = await startDevServer();
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      baseURL: BASE,
    });
    const page = await context.newPage();
    const captured = [];

    for (const slide of SLIDES) {
      captured.push(await captureSlide(page, slide));
    }
    await context.close();

    const carouselPath = path.join(OUT_DIR, 'carousel.html');
    fs.writeFileSync(carouselPath, buildCarouselHtml(captured), 'utf8');
    console.log(`✓ ${carouselPath}`);

    await recordPromoVideo(browser, BASE);

    console.log(`\n✅ Pacote completo em: ${OUT_DIR}`);
    console.log('   → Abra carousel.html para preview do carrossel');
    console.log('   → PNGs prontos para postar no Instagram');
    console.log('   → backstage-pro-promo.webm para Reels (importe no CapCut se precisar MP4)');
  } finally {
    await browser.close();
    if (devChild) devChild.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
