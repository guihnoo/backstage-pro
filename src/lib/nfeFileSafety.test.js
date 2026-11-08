import { describe, it, expect, vi } from 'vitest';
import { replaceNFeFile, removePreviousNFe, updateNFeWithLegacyFallback } from './nfeFileSafety';

const previousUrl = 'https://example.test/storage/v1/object/public/backstage/A/nfe/old.pdf';
function fixture() {
  const trace = [];
  const url = 'https://example.test/storage/v1/object/public/backstage/A/nfe/new.pdf';
  const storage = {
    upload: vi.fn(async () => { trace.push('upload'); return { data: { path: 'A/nfe/new.pdf' } }; }),
    getPublicUrl: () => ({ data: { publicUrl: url } }),
    remove: vi.fn(async () => { trace.push('remove'); return { error: null }; }),
  };
  const update = vi.fn(async patch => { trace.push('update'); return patch; });
  return { trace, storage, update, args: { storage, update, file: { name: 'nova.pdf' }, userId: 'A', eventId: 'evento', previousUrl, patch: { nfe_numero: '1' } } };
}

describe('Preservação do PDF de NF', () => {
  it('só remove o anterior depois de confirmar upload e vínculo', async () => {
    const f = fixture();
    await expect(replaceNFeFile(f.args)).resolves.toMatchObject({ cleanupPending: false });
    expect(f.trace).toEqual(['upload', 'update', 'remove']);
    expect(f.storage.upload.mock.calls[0][2].upsert).toBe(false);
  });
  it('falha no upload preserva o anterior e não altera o evento', async () => {
    const f = fixture();
    f.storage.upload.mockResolvedValue({ error: new Error('upload falhou') });
    await expect(replaceNFeFile(f.args)).rejects.toThrow('upload falhou');
    expect(f.update).not.toHaveBeenCalled();
    expect(f.storage.remove).not.toHaveBeenCalled();
  });
  it('resposta ambígua do banco não apaga nenhum arquivo', async () => {
    const f = fixture();
    f.update.mockRejectedValue(new Error('rede interrompida depois da gravação'));
    await expect(replaceNFeFile(f.args)).rejects.toThrow('rede interrompida');
    expect(f.storage.remove).not.toHaveBeenCalled();
  });
  it('resposta sem vínculo confirmado não permite apagar o anterior', async () => {
    const f = fixture();
    f.update.mockResolvedValue({ nf_number: '1' });
    await expect(replaceNFeFile(f.args)).rejects.toThrow('não foi confirmado');
    expect(f.storage.remove).not.toHaveBeenCalled();
  });
  it('falha na limpeza não transforma um novo PDF salvo em falha de upload', async () => {
    const f = fixture();
    f.storage.remove.mockResolvedValue({ error: new Error('limpeza falhou') });
    await expect(replaceNFeFile(f.args)).resolves.toMatchObject({ cleanupPending: true });
  });
  it('não tenta remover arquivo de outra conta ou fora da pasta de notas', async () => {
    const f = fixture();
    await removePreviousNFe(f.storage, previousUrl, 'B');
    await removePreviousNFe(f.storage, previousUrl.replace('/nfe/', '/logos/'), 'A');
    expect(f.storage.remove).not.toHaveBeenCalled();
  });
  it('não mascara erro de upload/vínculo com fallback de número', async () => {
    const update = vi.fn().mockRejectedValue({ code: '42703' });
    await expect(updateNFeWithLegacyFallback(update, 'evento', { nfe_numero: '1', nfe_arquivo_url: 'url' })).rejects.toEqual({ code: '42703' });
    expect(update).toHaveBeenCalledTimes(1);
  });
  it('fallback legado só é permitido para número/data e coluna ausente', async () => {
    const update = vi.fn().mockRejectedValueOnce({ code: '42703' }).mockResolvedValueOnce({ nf_number: '1' });
    await updateNFeWithLegacyFallback(update, 'evento', { nfe_numero: '1', nf_issued_at: '2026-10-30' });
    expect(update).toHaveBeenLastCalledWith('evento', { nf_number: '1', nf_issued_at: '2026-10-30' });
    update.mockReset().mockRejectedValue({ code: 'NETWORK' });
    await expect(updateNFeWithLegacyFallback(update, 'evento', { nfe_numero: '1' })).rejects.toEqual({ code: 'NETWORK' });
    expect(update).toHaveBeenCalledTimes(1);
  });
});
