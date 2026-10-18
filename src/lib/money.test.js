import { describe, it, expect } from 'vitest';
import { parseBRL, toBRLInput } from './money';

describe('parseBRL', () => {
  it('formatos brasileiros', () => {
    expect(parseBRL('1.200,50')).toBe(1200.5);
    expect(parseBRL('1200,5')).toBe(1200.5);
    expect(parseBRL('1.200')).toBe(1200);
    expect(parseBRL('12.500.000')).toBe(12500000);
    expect(parseBRL('R$ 850')).toBe(850);
    expect(parseBRL(' 850,00 ')).toBe(850);
  });
  it('ponto decimal tambem funciona', () => {
    expect(parseBRL('1200.50')).toBe(1200.5);
    expect(parseBRL('99.9')).toBe(99.9);
    expect(parseBRL(750)).toBe(750);
  });
  it('lixo vira NaN (nunca valor errado)', () => {
    for (const v of ['', 'abc', '1,2,3', '12a', null, undefined, NaN]) {
      expect(Number.isNaN(parseBRL(v))).toBe(true);
    }
  });
  it('toBRLInput', () => {
    expect(toBRLInput(1200.5)).toBe('1200,50');
    expect(toBRLInput('x')).toBe('');
    expect(parseBRL(toBRLInput(1750))).toBe(1750);
  });
});
