// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
const state = vi.hoisted(() => ({ userId: 'A', offline: true, base: null, rows: {}, reads: null }));
const db = vi.hoisted(() => ({ getMirrorRows: vi.fn(), getSyncQueue: vi.fn(), replaceMirrorStore: vi.fn() }));
vi.mock('../authContext', () => ({ useAuth: () => ({ user: { id: state.userId } }) }));
vi.mock('./useConnectivity', () => ({ useConnectivity: () => ({ offline: state.offline }) }));
vi.mock('./offlineDb', () => db);
vi.mock('./offlineSync', () => ({ queueOfflineCreate: vi.fn(), queueOfflineDelete: vi.fn(), queueOfflineUpdate: vi.fn() }));
import { createOfflineHook } from './createOfflineHook';

const useEntity = createOfflineHook({ useBaseHook: () => state.base, entity: 'events', storeName: 'events', dataKey: 'events', mapRowFromDb: row => row });
beforeEach(() => {
  state.userId = 'A'; state.offline = true;
  state.base = { events: [], loading: false, error: null };
  state.rows = { A: [{ id: 'a', user_id: 'A' }], B: [{ id: 'b', user_id: 'B' }] };
  vi.clearAllMocks();
  db.getMirrorRows.mockImplementation(async (_store, userId) => state.rows[userId] || []);
  db.getSyncQueue.mockResolvedValue([]);
  db.replaceMirrorStore.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('Proteção do espelho entre rede e contas', () => {
  it('não grava resposta vazia de falha ou modo offline no cache válido', async () => {
    const { result, rerender } = renderHook(() => useEntity());
    await waitFor(() => expect(result.current.events[0]?.id).toBe('a'));
    expect(db.replaceMirrorStore).not.toHaveBeenCalled();
    state.offline = false;
    state.base = { ...state.base, error: 'rede interrompida' };
    rerender();
    expect(db.replaceMirrorStore).not.toHaveBeenCalled();
    expect(result.current.events[0]?.id).toBe('a');
  });
  it('troca de conta descarta imediatamente a exibição do cache anterior', async () => {
    const { result, rerender } = renderHook(() => useEntity());
    await waitFor(() => expect(result.current.events[0]?.id).toBe('a'));
    let finishB;
    db.getMirrorRows.mockImplementation(() => new Promise(resolve => { finishB = resolve; }));
    state.userId = 'B'; rerender();
    expect(result.current.events).toEqual([]);
    finishB(state.rows.B);
    await waitFor(() => expect(result.current.events[0]?.id).toBe('b'));
  });
  it('não reatribui resposta online de A ao espelho de B durante troca de conta', async () => {
    state.userId = 'B'; state.offline = false;
    state.base = { events: [{ id: 'a', user_id: 'A' }], loading: false, error: null };
    const { result } = renderHook(() => useEntity());
    await waitFor(() => expect(db.getMirrorRows).toHaveBeenCalled());
    expect(result.current.events).toEqual([]);
    expect(db.replaceMirrorStore).not.toHaveBeenCalled();
  });
});
