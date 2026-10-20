import { describe, it, expect } from 'vitest';
import { getCategoryTheme } from './useCategoryTheme';

// Visual "All Access" (19/10/2026): todas as áreas usam amarelo #ffd400 + rosa #ff2e88.
// A cor antiga de cada área continua em categoryHex.
describe('getCategoryTheme', () => {
  it('returns lighting defaults for unknown category', () => {
    const theme = getCategoryTheme('unknown_cat');
    expect(theme.primaryHex).toBe('#ffd400');
    expect(theme.categoryHex).toBe('#A64AFF');
  });

  it('returns the All Access primary for lighting', () => {
    const theme = getCategoryTheme('lighting');
    expect(theme.primaryHex).toBe('#ffd400');
    expect(theme.accentHex).toBe('#ff2e88');
    expect(theme.cssVars['--bp-primary']).toBe('#ffd400');
  });

  it('exposes primaryStyle for CTAs and keeps the area color', () => {
    const theme = getCategoryTheme('dj');
    expect(theme.primaryStyle).toEqual({ backgroundColor: '#ffd400' });
    expect(theme.categoryHex).toBe('#00D9FF');
  });
});
