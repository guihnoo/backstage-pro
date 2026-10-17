import { describe, expect, it } from 'vitest';
import { projectYearEnd } from '@/lib/yearProjection';

describe('projectYearEnd', () => {
  it('outubro: 1.500 recebidos no ano projetam 1.800 (mesma conta em Metas e MEI)', () => {
    expect(projectYearEnd(1500, 10)).toBe(1800);
  });
  it('janeiro: o proprio mes vezes 12', () => {
    expect(projectYearEnd(1000, 1)).toBe(12000);
  });
  it('dezembro: igual ao total do ano', () => {
    expect(projectYearEnd(24000, 12)).toBe(24000);
  });
  it('sem receita da zero e entradas invalidas nao quebram', () => {
    expect(projectYearEnd(0, 7)).toBe(0);
    expect(projectYearEnd(null, 0)).toBe(0);
    expect(projectYearEnd('3000', 'x')).toBe(36000);
  });
});
