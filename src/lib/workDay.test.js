import { describe, expect, it } from 'vitest';
import {
  parseTimeToMinutes,
  addMinutesToClock,
  workedMinutes,
  isSameEntryExit,
  dailyBaseValue,
  dayCacheForMinutes,
  computeWorkDay,
  elapsedMsToMinutes,
  dayCacheForChoice,
  defaultDayChoice,
} from './workDay';

const horasExtras = { payment_model: 'HORAS_EXTRAS', daily_cache_value: 1200 };
const meioEDobra = { payment_model: 'MEIO_CACHE_E_DOBRA', daily_cache_value: 500 };

describe('parseTimeToMinutes', () => {
  it('lê HH:MM e HH:MM:SS', () => {
    expect(parseTimeToMinutes('08:30')).toBe(510);
    expect(parseTimeToMinutes('20:00:00')).toBe(1200);
  });
  it('rejeita valores inválidos', () => {
    expect(parseTimeToMinutes('')).toBeNull();
    expect(parseTimeToMinutes('25:00')).toBeNull();
    expect(parseTimeToMinutes(null)).toBeNull();
  });
});

describe('workedMinutes', () => {
  it('turno normal', () => {
    expect(workedMinutes('08:00', '20:00')).toBe(720);
  });
  it('virada da meia-noite: 20:00–04:00 = 8 h', () => {
    expect(workedMinutes('20:00', '04:00')).toBe(480);
  });
  it('entrada igual à saída = 0 h, salvo se marcado dia seguinte (24 h)', () => {
    expect(workedMinutes('20:00', '20:00')).toBe(0);
    expect(workedMinutes('20:00', '20:00', { nextDay: true })).toBe(1440);
    expect(isSameEntryExit('20:00', '20:00')).toBe(true);
  });
});

describe('dailyBaseValue', () => {
  it('usa o cachê inserido (daily_cache_value)', () => {
    expect(dailyBaseValue({ daily_cache_value: 900, cache_valor_base: 1000 })).toBe(900);
  });
  it('cai para cache_valor_base legado', () => {
    expect(dailyBaseValue({ cache_valor_base: 1000 })).toBe(1000);
  });
  it('estimated_revenue é total do evento: divide pelos dias', () => {
    expect(dailyBaseValue({ estimated_revenue: 3000, start_date: '2026-10-01', end_date: '2026-10-03' })).toBe(1000);
  });
});

describe('dayCacheForMinutes — HORAS_EXTRAS (cachê / 12 por hora acima de 12 h)', () => {
  it('12 h = diária cheia', () => {
    expect(dayCacheForMinutes(horasExtras, 720)).toBe(1200);
  });
  it('14 h = 1200 + 2 x 100 = 1400', () => {
    expect(dayCacheForMinutes(horasExtras, 840)).toBe(1400);
  });
  it('menos de 12 h continua a diária', () => {
    expect(dayCacheForMinutes(horasExtras, 480)).toBe(1200);
  });
  it('0 h não cobra nada sozinho', () => {
    expect(dayCacheForMinutes(horasExtras, 0)).toBe(0);
  });
  it('modelo vazio é tratado como HORAS_EXTRAS', () => {
    expect(dayCacheForMinutes({ daily_cache_value: 1200 }, 780)).toBe(1300);
  });
});

describe('dayCacheForMinutes — MEIO_CACHE_E_DOBRA (meia = metade, dobra = 2x)', () => {
  it('até 6 h = meia (500 -> 250)', () => {
    expect(dayCacheForMinutes(meioEDobra, 360)).toBe(250);
  });
  it('entre 6 h e 12 h = cachê cheio', () => {
    expect(dayCacheForMinutes(meioEDobra, 361)).toBe(500);
    expect(dayCacheForMinutes(meioEDobra, 720)).toBe(500);
  });
  it('acima de 12 h = dobra (500 -> 1000)', () => {
    expect(dayCacheForMinutes(meioEDobra, 721)).toBe(1000);
  });
  it('faixa decidida pelos minutos exatos, não pelo total arredondado (auditoria 1A)', () => {
    // Antes: 12:02 arredondava para 12,0 h (cheio) e 12:03 para 12,1 h (dobra).
    // Agora a regra é única e previsível. A escolha manual por dia chega no Lote 2.
    expect(computeWorkDay({ event: meioEDobra, entry: '08:00', exit: '20:00' }).cache).toBe(500);
    expect(computeWorkDay({ event: meioEDobra, entry: '08:00', exit: '14:00' }).cache).toBe(250);
    expect(computeWorkDay({ event: meioEDobra, entry: '08:00', exit: '14:03' }).cache).toBe(500);
  });
  it('usa a mesma base nas três faixas', () => {
    const ev = { payment_model: 'MEIO_CACHE_E_DOBRA', daily_cache_value: 1200, cache_valor_base: 1000 };
    expect(dayCacheForMinutes(ev, 240)).toBe(600);
    expect(dayCacheForMinutes(ev, 480)).toBe(1200);
    expect(dayCacheForMinutes(ev, 840)).toBe(2400);
  });
});

describe('computeWorkDay', () => {
  it('20:00–04:00 = 8,0 h, 0 extra', () => {
    const r = computeWorkDay({ event: horasExtras, entry: '20:00', exit: '04:00' });
    expect(r).toMatchObject({ minutes: 480, totalHours: 8, overtimeHours: 0, cache: 1200 });
  });
  it('08:00–22:00 = 14 h, 2 h extra, R$ 1.400', () => {
    const r = computeWorkDay({ event: horasExtras, entry: '08:00', exit: '22:00' });
    expect(r).toMatchObject({ totalHours: 14, overtimeHours: 2, cache: 1400 });
  });
  it('entrada = saída pede resposta "virou o dia?" e não cobra', () => {
    const r = computeWorkDay({ event: horasExtras, entry: '20:00', exit: '20:00' });
    expect(r.needsNextDayAnswer).toBe(true);
    expect(r.cache).toBe(0);
  });
  it('entrada = saída marcada como dia seguinte = 24 h', () => {
    const r = computeWorkDay({ event: horasExtras, entry: '20:00', exit: '20:00', nextDay: true });
    expect(r).toMatchObject({ minutes: 1440, overtimeHours: 12, cache: 2400, needsNextDayAnswer: false });
  });
  it('cronômetro de 26 h usa a duração real (bug: virava 2 h)', () => {
    const minutes = elapsedMsToMinutes(26 * 3600000);
    const r = computeWorkDay({ event: horasExtras, entry: '20:00', exit: addMinutesToClock('20:00', minutes), durationMinutes: minutes });
    expect(r.minutes).toBe(1560);
    expect(r.totalHours).toBe(26);
    expect(r.cache).toBe(1200 + 14 * 100);
  });
  it('cronômetro não arredonda para 15 min', () => {
    expect(elapsedMsToMinutes(7 * 60000 + 20000)).toBe(7);
  });
  it('extra fracionada usa minutos exatos', () => {
    const r = computeWorkDay({ event: horasExtras, entry: '08:00', exit: '20:30' });
    expect(r.cache).toBe(1250);
    expect(r.overtimeHours).toBe(0.5);
  });
});

describe('Lote 2 — escolha por dia (½ / 1 / 2 e hora extra)', () => {
  const ev = { payment_model: 'MEIO_CACHE_E_DOBRA', daily_cache_value: 500 };

  it('meia = metade, cheia = cachê, dobra = 2x — independente das horas', () => {
    expect(dayCacheForChoice(ev, 840, { regime: 'meia', horaExtra: false })).toBe(250);
    expect(dayCacheForChoice(ev, 240, { regime: 'cheia', horaExtra: false })).toBe(500);
    expect(dayCacheForChoice(ev, 300, { regime: 'dobra', horaExtra: false })).toBe(1000);
  });

  it('12:03 não dobra sozinho: com regime cheia continua o cachê', () => {
    const r = computeWorkDay({ event: ev, entry: '08:00', exit: '20:03', regime: 'cheia', horaExtra: false });
    expect(r.cache).toBe(500);
  });

  it('hora extra ligada soma cachê/12 por hora acima de 12 h', () => {
    const r = computeWorkDay({ event: horasExtras, entry: '08:00', exit: '22:00', regime: 'cheia', horaExtra: true });
    expect(r.cache).toBe(1400);
  });

  it('hora extra desligada não soma nada', () => {
    const r = computeWorkDay({ event: horasExtras, entry: '08:00', exit: '22:00', regime: 'cheia', horaExtra: false });
    expect(r.cache).toBe(1200);
  });

  it('dobra com hora extra: 2x + extras', () => {
    expect(dayCacheForChoice(horasExtras, 840, { regime: 'dobra', horaExtra: true })).toBe(2600);
  });

  it('0 minuto não cobra, mesmo com escolha', () => {
    expect(dayCacheForChoice(ev, 0, { regime: 'dobra', horaExtra: true })).toBe(0);
  });

  it('regime inválido cai na regra antiga por modelo', () => {
    const r = computeWorkDay({ event: ev, entry: '08:00', exit: '12:00', regime: 'xyz' });
    expect(r.cache).toBe(250);
  });

  it('sugestão: cheia; hora extra ligada só para evento "Horas Extras"', () => {
    expect(defaultDayChoice(horasExtras)).toEqual({ regime: 'cheia', horaExtra: true });
    expect(defaultDayChoice(ev)).toEqual({ regime: 'cheia', horaExtra: false });
  });

  it('sugestão respeita o que já foi gravado no dia', () => {
    expect(defaultDayChoice(horasExtras, { regime: 'dobra', hora_extra: false })).toEqual({ regime: 'dobra', horaExtra: false });
  });
});

describe('addMinutesToClock', () => {
  it('passa da meia-noite', () => {
    expect(addMinutesToClock('20:00', 12 * 60)).toBe('08:00');
  });
  it('entrada inválida devolve vazio', () => {
    expect(addMinutesToClock('', 60)).toBe('');
  });
});
