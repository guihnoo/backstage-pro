import { describe, it, expect } from 'vitest';
import { isChunkLoadError, withChunkReload } from './chunkReload';

describe('chunkReload', () => {
  it('reconhece erro de arquivo de tela que sumiu após nova versão', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/Home-abc.js'))).toBe(true);
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
  });

  it('carregamento normal passa direto', async () => {
    const load = withChunkReload(async () => ({ default: 'Tela' }));
    await expect(load()).resolves.toEqual({ default: 'Tela' });
  });

  it('erro comum não recarrega e é repassado', async () => {
    const load = withChunkReload(async () => { throw new Error('bug na tela'); });
    await expect(load()).rejects.toThrow('bug na tela');
  });
});
