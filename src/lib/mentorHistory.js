const PREFIX = 'backstage_ai_conversations';
const MAX_HISTORY = 20;

function storageKey(userId) {
  if (!userId) return null;
  return `${PREFIX}:${userId}`;
}

// O histórico legado não identifica o dono. Preservá-lo sem exibir ou atribuir
// automaticamente a quem fizer login neste aparelho.
export function loadMentorHistory(userId, storage = globalThis.localStorage) {
  const key = storageKey(userId);
  if (!key) return [];
  try {
    const value = JSON.parse(storage.getItem(key) || '[]');
    return Array.isArray(value) ? value.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

export function saveMentorHistory(userId, conversations, storage = globalThis.localStorage) {
  const key = storageKey(userId);
  if (!key) return;
  storage.setItem(key, JSON.stringify(conversations.slice(0, MAX_HISTORY)));
}
