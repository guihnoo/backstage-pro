import { checkSupabaseReachable } from '@/lib/checkSupabaseReachable';

const PROBE_INTERVAL_MS = 30_000;

/** Estado global — única fonte de verdade; o usuário nunca escolhe modo offline. */
let online = typeof navigator !== 'undefined' ? navigator.onLine : true;
let probing = false;
let probeTimer = null;
let monitorStarted = false;

const subscribers = new Set();

function emitChange(reason) {
  const snapshot = getConnectivityState();
  subscribers.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (err) {
      console.error('[connectivity]', err);
    }
  });
  window.dispatchEvent(
    new CustomEvent('backstage:connectivity-changed', {
      detail: { ...snapshot, reason },
    })
  );
}

function setOnline(next, reason) {
  const normalized = Boolean(next);
  if (online === normalized) return;
  const wasOffline = !online;
  online = normalized;
  emitChange(reason);
  if (wasOffline && online) {
    window.dispatchEvent(new CustomEvent('backstage:reconnect'));
  }
}

export function getConnectivityState() {
  return { online };
}

/** @deprecated use getConnectivityState().online — mantido para compat interna */
export function isAppOnline() {
  return online;
}

export function subscribeConnectivity(listener) {
  subscribers.add(listener);
  listener(getConnectivityState());
  return () => subscribers.delete(listener);
}

export function markConnectivityOffline(reason = 'network-error') {
  setOnline(false, reason);
}

export function markConnectivityOnline(reason = 'network-success') {
  setOnline(true, reason);
}

export async function probeConnectivity({ silent = true } = {}) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setOnline(false, 'navigator-offline');
    return false;
  }

  if (probing) return online;
  probing = true;

  try {
    const result = await checkSupabaseReachable();
    setOnline(result.ok, result.ok ? 'probe-ok' : 'probe-fail');
    return result.ok;
  } catch {
    setOnline(false, 'probe-error');
    return false;
  } finally {
    probing = false;
  }
}

function schedulePeriodicProbe() {
  if (probeTimer) return;
  probeTimer = window.setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    probeConnectivity({ silent: true });
  }, PROBE_INTERVAL_MS);
}

/** Inicia detecção automática — chamar uma vez no boot autenticado. */
export function initConnectivityMonitor() {
  if (monitorStarted || typeof window === 'undefined') return;
  monitorStarted = true;

  probeConnectivity({ silent: true });

  window.addEventListener('offline', () => setOnline(false, 'browser-offline'));
  window.addEventListener('online', () => {
    probeConnectivity({ silent: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      probeConnectivity({ silent: true });
    }
  });

  window.addEventListener('focus', () => probeConnectivity({ silent: true }));
  schedulePeriodicProbe();
}

export function stopConnectivityMonitor() {
  if (probeTimer) {
    clearInterval(probeTimer);
    probeTimer = null;
  }
  monitorStarted = false;
}
