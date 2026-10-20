import { describe, it, expect } from 'vitest';
import { getCategoryConfig, getCategoryLabel, resolveCategoryId, getAllCategories } from './categoryConfig';
import { CATEGORIES as ONBOARDING } from './eventCategories';

describe('areas do cadastro tem tema proprio (nao caem como Iluminacao)', () => {
  it('toda area do onboarding tem tema correspondente', () => {
    for (const c of ONBOARDING) {
      const cfg = getCategoryConfig(c.id);
      if (c.id !== 'lighting') expect(cfg.id, c.id).not.toBe('lighting');
    }
  });

  it('Palco, Arte e Catering', () => {
    expect(getCategoryLabel('stage')).toBe('Palco/Rigging');
    expect(getCategoryConfig('art').id).toBe('scenography');
    expect(getCategoryConfig('catering').id).toBe('hospitality');
    expect(resolveCategoryId('art')).toBe('scenography');
  });

  it('Palco aparece na lista para escolher no Perfil', () => {
    expect(getAllCategories().some((c) => c.id === 'stage')).toBe(true);
  });

  it('desconhecido mantem o valor e so o visual usa o padrao', () => {
    expect(resolveCategoryId('xyz')).toBe('xyz');
    expect(getCategoryConfig('xyz').id).toBe('lighting');
  });
});
