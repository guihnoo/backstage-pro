import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_THRESHOLD = 72;

/**
 * Pull-to-refresh no container [data-app-scroll] (AppLayout).
 */
export function usePullToRefresh(onRefresh, { enabled = true, threshold = DEFAULT_THRESHOLD } = {}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const distanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    refreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  const runRefresh = useCallback(async () => {
    if (refreshingRef.current || !onRefreshRef.current) return;
    refreshingRef.current = true;
    setIsRefreshing(true);
    setPullDistance(threshold);
    try {
      await onRefreshRef.current();
    } finally {
      refreshingRef.current = false;
      setIsRefreshing(false);
      setPullDistance(0);
      distanceRef.current = 0;
    }
  }, [threshold]);

  useEffect(() => {
    if (!enabled) return undefined;

    const el = document.querySelector('[data-app-scroll]');
    if (!el) return undefined;

    const onTouchStart = (e) => {
      if (el.scrollTop > 0 || refreshingRef.current) return;
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    };

    const onTouchMove = (e) => {
      if (!pullingRef.current || el.scrollTop > 0) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        distanceRef.current = 0;
        setPullDistance(0);
        return;
      }
      const damped = Math.min(delta * 0.45, threshold * 1.4);
      distanceRef.current = damped;
      setPullDistance(damped);
      if (damped > 8) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      if (distanceRef.current >= threshold) {
        runRefresh();
      } else {
        distanceRef.current = 0;
        setPullDistance(0);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [enabled, runRefresh, threshold]);

  return { pullDistance, isRefreshing, threshold, refresh: runRefresh };
}
