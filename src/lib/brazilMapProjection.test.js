import { describe, expect, it } from 'vitest';
import { BOUNDS, latlngToSvg, STATE_CENTROIDS } from './brazilMapProjection';

function insideViewBox({ x, y }) {
  return x >= 0 && x <= BOUNDS.w && y >= 0 && y <= BOUNDS.h;
}

describe('brazilMapProjection', () => {
  it('usa limite leste real do Brasil (não desloca pins para o Atlântico)', () => {
    expect(BOUNDS.east).toBe(-34.79);
  });

  it('projeta São Paulo dentro do viewBox', () => {
    expect(insideViewBox(latlngToSvg(-23.55, -46.63))).toBe(true);
  });

  it('projeta Manaus dentro do viewBox', () => {
    expect(insideViewBox(latlngToSvg(-3.1, -60.03))).toBe(true);
  });

  it('projeta Ponta do Seixas (extremo leste) próximo da borda direita', () => {
    const { x } = latlngToSvg(-7.15, -34.79);
    expect(x).toBeGreaterThan(BOUNDS.w * 0.85);
    expect(x).toBeLessThanOrEqual(BOUNDS.w);
  });

  it('mantém centróides de UF dentro do viewBox', () => {
    for (const [uf, point] of Object.entries(STATE_CENTROIDS)) {
      expect(insideViewBox(point), `UF ${uf} fora do viewBox`).toBe(true);
    }
  });
});
