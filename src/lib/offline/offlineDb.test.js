import { beforeAll, afterAll, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./offlineDb.js', import.meta.url), 'utf8').replace(/^export /gm, '');
const exposed = 'replaceMirrorStore,getMirrorRows,enqueueSyncItem,getSyncQueue,saveIdMapping,resolveRecordId,clearUserOfflineData';
let browser;
let context;
let page;
beforeAll(async () => { browser = await chromium.launch({ headless: true }); }, 30_000);
afterAll(async () => { await browser?.close(); }, 30_000);
beforeEach(async () => {
  context = await browser.newContext();
  await context.route('**/*', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Teste local isolado</title>' }));
  page = await context.newPage();
  await page.goto('http://127.0.0.1/offline-test');
});
afterEach(async () => { await context?.close(); });
async function load() { await page.addScriptTag({ content: `(() => { ${source}; window.offlineTest = {${exposed}}; })();` }); }

describe('IndexedDB real com dados sintéticos e rede bloqueada', () => {
  it('erro de clonagem reverte a transação sem esvaziar o espelho', async () => {
    await load();
    const result = await page.evaluate(async () => {
      const db = window.offlineTest;
      await db.replaceMirrorStore('events', 'A', [{ id: 'original', title: 'preservado' }]);
      let rejected = false;
      try {
        await db.replaceMirrorStore('events', 'A', [{ id: 'novo', invalid: () => {} }]);
      } catch {
        rejected = true;
      }
      return { rejected, rows: await db.getMirrorRows('events', 'A') };
    });
    expect(result.rejected).toBe(true);
    expect(result.rows.map(row => row.id)).toEqual(['original']);
  });
  it('renovação mantém registros atualizados e novos sem afetar B', async () => {
    await load();
    const result = await page.evaluate(async () => {
      const db = window.offlineTest;
      await db.replaceMirrorStore('events', 'A', [{ id: 'a1', title: 'antes' }]);
      await db.replaceMirrorStore('events', 'B', [{ id: 'b1', title: 'B' }]);
      await db.replaceMirrorStore('events', 'A', [{ id: 'a1', title: 'depois' }, { id: 'a2', title: 'novo' }]);
      return { a: await db.getMirrorRows('events', 'A'), b: await db.getMirrorRows('events', 'B') };
    });
    expect(result.a.map(row => row.title)).toEqual(['depois', 'novo']);
    expect(result.b).toHaveLength(1);
    expect(result.b[0].title).toBe('B');
  });
  it('fila e mapeamentos novos respeitam conta e limpeza seletiva', async () => {
    await load();
    const result = await page.evaluate(async () => {
      const db = window.offlineTest;
      await db.enqueueSyncItem({ id: 'qA', userId: 'A', createdAt: '2026-10-30', entity: 'events' });
      await db.enqueueSyncItem({ id: 'qB', userId: 'B', createdAt: '2026-10-30', entity: 'events' });
      await db.saveIdMapping('A', 'tmpA', 'realA', 'events');
      const before = await db.getSyncQueue('A');
      const cannotReadA = await db.resolveRecordId('B', 'tmpA');
      await db.clearUserOfflineData('A');
      return { before, cannotReadA, after: await db.getSyncQueue('A'), b: await db.getSyncQueue('B'), mapping: await db.resolveRecordId('A', 'tmpA') };
    });
    expect(result.before).toHaveLength(1);
    expect(result.cannotReadA).toBe('tmpA');
    expect(result.after).toHaveLength(0);
    expect(result.b).toHaveLength(1);
    expect(result.mapping).toBe('tmpA');
  });
  it('migra a versão 1: mapeamentos valem, fila antiga fica guardada sem reenvio automático', async () => {
    await page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.open('backstage-offline-v1', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const name of ['events', 'clients', 'expenses', 'daily_work', 'sync_queue', 'id_map']) {
          const store = db.createObjectStore(name, { keyPath: name === 'id_map' ? 'tempId' : 'id' });
          store.createIndex('user_id', 'user_id');
          if (name === 'sync_queue') {
            store.createIndex('createdAt', 'createdAt');
            store.put({ id: 'legacyA', userId: 'A', createdAt: '2026-10-30', entity: 'events' });
            store.put({ id: 'legacyB', userId: 'B', createdAt: '2026-10-30', entity: 'events' });
          }
          if (name === 'id_map') store.put({ tempId: 'oldTemp', userId: 'A', realId: 'oldReal', entity: 'events' });
        }
      };
      request.onsuccess = () => { request.result.close(); resolve(); };
      request.onerror = () => reject(request.error);
    }));
    await load();
    const result = await page.evaluate(async () => {
      // Primeiro o app abre o banco (faz a migração); só depois olhamos o que ficou guardado.
      const a = await window.offlineTest.getSyncQueue('A');
      const b = await window.offlineTest.getSyncQueue('B');
      const mapped = await window.offlineTest.resolveRecordId('A', 'oldTemp');
      const guardados = await new Promise((resolve, reject) => {
        const req = indexedDB.open('backstage-offline-v1');
        req.onsuccess = () => {
          const all = req.result.transaction('sync_queue').objectStore('sync_queue').getAll();
          all.onsuccess = () => { resolve(all.result); req.result.close(); };
          all.onerror = () => reject(all.error);
        };
        req.onerror = () => reject(req.error);
      });
      return { a, b, mapped, guardados };
    });
    // Não reenvia alterações antigas (sobrescreveriam edições feitas depois)...
    expect(result.a).toEqual([]);
    expect(result.b).toEqual([]);
    // ...mas não apaga nada: ficam guardadas e marcadas.
    expect(result.guardados.map(row => [row.id, row.legacy_v1])).toEqual([['legacyA', true], ['legacyB', true]]);
    expect(result.mapped).toBe('oldReal');
  });
});
