const STORAGE_PREFIX = 'backstage:profile:';

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function getOfflineProfile(userId) {
  if (!userId || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data && parsed.userId === userId ? parsed.data : null;
  } catch {
    return null;
  }
}

export function setOfflineProfile(userId, profile) {
  if (!userId || !profile || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify({ userId, data: profile, savedAt: new Date().toISOString() })
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearOfflineProfile(userId) {
  if (!userId || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    /* ignore */
  }
}
