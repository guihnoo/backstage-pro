// Agenda: tocar num dia que NÃO é hoje e registrar horas tem que abrir e gravar naquele dia.
// 07/11: o Guih via a janela abrir no dia de hoje e o horário não salvar.
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, richSeed } from '../helpers/fakeDb.js';

const localISO = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('sv-SE');
};
const MULTI_ID = '00000000-0000-4000-8000-000000000299';

function seedComTrabalhoDeVariosDias() {
  const seed = richSeed();
  const base = seed.events.find((e) => e.title === 'Show no Allianz');
  // Trabalho de 5 dias que passa por hoje (o caso em que o app trocava para hoje).
  seed.events.push({ ...base, id: MULTI_ID, title: 'Montagem Festival', start_date: localISO(-2), end_date: localISO(2), event_date: localISO(-2) });
  // Tira o show de hoje para o dia de hoje ter só o trabalho de vários dias.
  seed.events = seed.events.filter((e) => e.id !== base.id);
  return seed;
}

async function abrirHorasNoDia(page, offset) {
  const dia = new Date();
  dia.setDate(dia.getDate() + offset);
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 60_000 });
  // Se o dia cair em outro mês, a Agenda abre no mês de hoje: só testa dias do mesmo mês.
  await page.getByRole('button', { name: new RegExp(`^Dia ${dia.getDate()}(:|$)`) }).first().click();
  await page.getByRole('button', { name: /^Horas$/ }).first().click();
  return page.getByRole('dialog');
}

test.describe('Agenda: horas no dia tocado', () => {
  test.setTimeout(120_000);

  for (const offset of [-1, 1]) {
    test(`registrar horas no dia ${offset > 0 ? 'de amanhã' : 'de ontem'} abre e grava naquele dia`, async ({ page }) => {
      const alvo = new Date();
      alvo.setDate(alvo.getDate() + offset);
      test.skip(alvo.getMonth() !== new Date().getMonth(), 'dia em outro mês');
      await page.setViewportSize({ width: 390, height: 844 });
      await seedAuth(page);
      await installFakeDb(page, seedComTrabalhoDeVariosDias());
      let gravado = null;
      page.on('request', (r) => {
        if (/\/rest\/v1\/daily_work/.test(r.url()) && ['POST', 'PATCH'].includes(r.method())) gravado = r.postDataJSON();
      });

      const dialog = await abrirHorasNoDia(page, offset);
      await expect(dialog.getByRole('heading', { name: /registrar horas/i })).toBeVisible({ timeout: 10_000 });
      await expect(dialog.locator('input[type="date"]').first()).toHaveValue(localISO(offset));

      await dialog.locator('input[type="time"]').nth(0).fill('14:00');
      await dialog.locator('input[type="time"]').nth(1).fill('22:00');
      // Espera um pouco: o app atualiza os dados sozinho e isso apagava o que foi digitado.
      await page.waitForTimeout(1500);
      await expect(dialog.locator('input[type="time"]').nth(0)).toHaveValue('14:00');
      await dialog.getByRole('button', { name: /^salvar$/i }).click();

      await expect.poll(() => gravado, { timeout: 10_000 }).not.toBeNull();
      expect(gravado).toMatchObject({ event_id: MULTI_ID, work_date: localISO(offset), entry_time: '14:00', exit_time: '22:00' });
    });
  }
});
