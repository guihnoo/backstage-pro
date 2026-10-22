import { describe, it, expect } from 'vitest';
import { normalizeRoleRates, ratesMapToList, ratesListToMap, functionOptions, rateForFunction, eventFunctionId, categoryLabel } from './roleRates';

const profile = {
  category: 'lighting',
  daily_rate: 850,
  role_rates: [
    { category: 'video', daily_rate: 950 },
    { category: 'audio', daily_rate: '700' },
  ],
};

describe('normalizeRoleRates', () => {
  it('limpa função inexistente, repetida, sem cachê e a principal', () => {
    expect(normalizeRoleRates([
      { category: 'video', daily_rate: 950 },
      { category: 'video', daily_rate: 999 },
      { category: 'nao-existe', daily_rate: 100 },
      { category: 'audio', daily_rate: 0 },
      { category: 'lighting', daily_rate: 800 },
    ], 'lighting')).toEqual([{ category: 'video', daily_rate: 950 }]);
  });

  it('aguenta valor estranho', () => {
    expect(normalizeRoleRates(null)).toEqual([]);
    expect(normalizeRoleRates('x')).toEqual([]);
  });
});

describe('formulário do Perfil', () => {
  it('mapa digitado vira lista e volta', () => {
    const list = ratesMapToList({ video: '950', audio: '1.200,50', photo: '' }, 'lighting');
    expect(list).toEqual([{ category: 'video', daily_rate: 950 }, { category: 'audio', daily_rate: 1200.5 }]);
    expect(ratesListToMap(list)).toEqual({ video: '950', audio: '1200,5' });
  });
});

describe('funções no trabalho', () => {
  it('principal primeiro, depois as outras com o seu cachê', () => {
    expect(functionOptions(profile)).toEqual([
      { id: 'lighting', label: 'Iluminação', rate: 850, primary: true },
      { id: 'video', label: categoryLabel('video'), rate: 950, primary: false },
      { id: 'audio', label: 'Técnico de Som', rate: 700, primary: false },
    ]);
  });

  it('cachê da função escolhida', () => {
    expect(rateForFunction(profile, 'video')).toBe(950);
    expect(rateForFunction(profile, 'lighting')).toBe(850);
    expect(rateForFunction(profile, 'photo')).toBeNull();
  });

  it('trabalho sem função escolhida conta como a principal', () => {
    expect(eventFunctionId({ category: null }, profile)).toBe('lighting');
    expect(eventFunctionId({ category: 'video' }, profile)).toBe('video');
    expect(eventFunctionId({}, {})).toBeNull();
  });
});
