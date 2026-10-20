import { describe, it, expect, vi } from 'vitest';
import { dedupeRequest, _inflightSize } from './requestDedupe';

describe('dedupeRequest', () => {
  it('pedidos iguais ao mesmo tempo fazem uma consulta só', async () => {
    const fn = vi.fn(async () => ({ data: [1, 2] }));
    const [a, b, c] = await Promise.all([
      dedupeRequest('events:u1', fn),
      dedupeRequest('events:u1', fn),
      dedupeRequest('events:u1', fn),
    ]);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(a).toEqual({ data: [1, 2] });
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it('depois que a resposta chega, o próximo pedido busca de novo', async () => {
    const fn = vi.fn(async () => 'ok');
    await dedupeRequest('k', fn);
    await dedupeRequest('k', fn);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(_inflightSize()).toBe(0);
  });

  it('chaves diferentes (outro usuário) não se misturam', async () => {
    const fn = vi.fn(async () => 'x');
    await Promise.all([dedupeRequest('events:u1', fn), dedupeRequest('events:u2', fn)]);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('erro libera a chave para tentar de novo', async () => {
    const bad = vi.fn(async () => { throw new Error('rede'); });
    await expect(dedupeRequest('e', bad)).rejects.toThrow('rede');
    const good = vi.fn(async () => 'ok');
    await expect(dedupeRequest('e', good)).resolves.toBe('ok');
  });
});
