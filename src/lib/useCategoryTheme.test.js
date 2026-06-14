import { describe, it, expect } from 'vitest';
import { getCategoryTheme } from './useCategoryTheme';

describe('getCategoryTheme', () => {
  it('returns lighting defaults for unknown category', () => {
    const theme = getCategoryTheme('unknown_cat');
    expect(theme.primaryHex).toBe('#A64AFF');
  });

  it('returns category primary for lighting', () => {
    const theme = getCategoryTheme('lighting');
    expect(theme.primaryHex).toBe('#A64AFF');
    expect(theme.cssVars['--bp-primary']).toBe('#A64AFF');
  });

  it('exposes primaryStyle for CTAs', () => {
    const theme = getCategoryTheme('dj');
    expect(theme.primaryStyle).toEqual({ backgroundColor: '#00D9FF' });
  });
});
