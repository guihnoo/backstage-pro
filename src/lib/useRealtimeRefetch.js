import { useEffect, useRef } from 'react';
import { realtimeBus } from './realtimeBus';

const DEBOUNCE_MS = 120;

/**
 * Reexecuta refetch em silêncio quando outro dispositivo altera dados no Supabase.
 * @param {string|string[]} tables - Nomes das tabelas (events, clients, …)
 * @param {(opts?: { silent?: boolean }) => void} refetch
 */
export function useRealtimeRefetch(tables, refetch) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  const tableKey = Array.isArray(tables) ? tables.join(',') : tables;

  useEffect(() => {
    if (!refetchRef.current || !tableKey) return;

    const list = Array.isArray(tables) ? tables : [tables];
    let timer;

    const scheduleRefetch = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        refetchRef.current?.({ silent: true });
      }, DEBOUNCE_MS);
    };

    const unsubs = list.map((table) => realtimeBus.subscribe(table, scheduleRefetch));

    return () => {
      clearTimeout(timer);
      unsubs.forEach((unsub) => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey]);
}
