const KEY = 'backstage_timer';

export function getTimer() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function startTimer({ eventId, eventTitle }) {
  const state = { eventId, eventTitle, startedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('backstage:timer', { detail: state }));
}

export function stopTimer() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent('backstage:timer', { detail: null }));
}

export function getElapsedMs(timer) {
  if (!timer?.startedAt) return 0;
  return Date.now() - timer.startedAt;
}

export function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function elapsedToHours(ms) {
  return Math.round((ms / 3600000) * 4) / 4; // arredonda para 0.25h
}
