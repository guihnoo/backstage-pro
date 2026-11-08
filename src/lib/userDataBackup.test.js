import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
const state = vi.hoisted(() => ({ records: {}, fail: null, userId: 'A', authCalls: 0, switchAccount: false }));
vi.mock('./supabase', () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: { id: ++state.authCalls > 1 && state.switchAccount ? 'B' : state.userId } } }) },
  from: table => ({ select: () => ({ eq: (column, id) => {
    if (column !== 'user_id' || id !== 'A') throw new Error('Filtro incorreto');
    const result = data => ({ data, error: state.fail === table ? { message: 'falha sintética' } : null });
    return {
      maybeSingle: async () => result(state.records[table] || null),
      order: () => ({ range: async (from, to) => result((state.records[table] || []).slice(from, to + 1)) }),
    };
  } }) }),
} }));
import { createBackup } from './userDataBackup';

let blob;
let click;
beforeEach(() => {
  Object.assign(state, { records: {}, fail: null, userId: 'A', authCalls: 0, switchAccount: false });
  blob = null;
  click = vi.fn();
  vi.useFakeTimers();
  vi.stubGlobal('URL', { createObjectURL: b => { blob = b; return 'blob:teste'; }, revokeObjectURL: vi.fn() });
  vi.stubGlobal('document', { createElement: () => ({ click, remove: vi.fn() }), body: { appendChild: vi.fn() } });
});
afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('Exportação íntegra dos cadastros', () => {
  it.each(['events', 'daily_work', 'clients', 'expenses', 'user_settings'])('falha em %s impede sucesso e download parcial', async table => {
    state.fail = table;
    expect((await createBackup()).data.success).toBe(false);
    expect(blob).toBe(null);
    expect(click).not.toHaveBeenCalled();
  });
  it('pagina além de 1000 registros e informa exatamente o escopo', async () => {
    state.records.events = Array.from({ length: 1001 }, (_, i) => ({ id: String(i), user_id: 'A' }));
    expect((await createBackup()).data.success).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    const exported = JSON.parse(await blob.text());
    expect(exported.events).toHaveLength(1001);
    expect(exported.manifest).toMatchObject({ attachment_links_only: true, restore_available: false });
    expect(exported.manifest.excluded).toContain('attachment_files');
  });
  it('não exporta dados da conta anterior se a sessão mudar no meio', async () => {
    state.switchAccount = true;
    expect((await createBackup()).data.success).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });
  it('não inicia exportação sem autenticação', async () => {
    state.userId = null;
    expect((await createBackup()).data.success).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });
});
