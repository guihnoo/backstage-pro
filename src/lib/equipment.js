// Checklist de equipamento por show (ideia #113): o que levar e o que voltou.
// Trabalho: events.equipment_items = [{ id, text, packed, returned }]
// Meu kit:  user_settings.equipment_kit = [{ id, text }]

const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `eq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
const key = (text) => String(text || '').trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

export function normalizeItems(raw) {
  const seen = new Set();
  const out = [];
  for (const it of Array.isArray(raw) ? raw : []) {
    const text = String(it?.text || '').trim().slice(0, 120);
    if (!text || seen.has(key(text))) continue;
    seen.add(key(text));
    const packed = Boolean(it.packed);
    out.push({ id: it.id || newId(), text, packed, returned: packed && Boolean(it.returned) });
  }
  return out;
}

export function normalizeKit(raw) {
  return normalizeItems(raw).map(({ id, text }) => ({ id, text }));
}

export function addItem(items, text) {
  const t = String(text || '').trim().slice(0, 120);
  if (!t || items.some((i) => key(i.text) === key(t))) return items;
  return [...items, { id: newId(), text: t, packed: false, returned: false }];
}

export function removeItem(items, id) {
  return items.filter((i) => i.id !== id);
}

/** Na mala: tirar da mala também desmarca "voltou". */
export function togglePacked(items, id) {
  return items.map((i) => (i.id === id ? { ...i, packed: !i.packed, returned: i.packed ? false : i.returned } : i));
}

/** Voltou: só vale para o que foi na mala. */
export function toggleReturned(items, id) {
  return items.map((i) => (i.id === id && i.packed ? { ...i, returned: !i.returned } : i));
}

/** Junta o meu kit ao trabalho (sem repetir o que já está). */
export function addKit(items, kit) {
  return normalizeKit(kit).reduce((acc, k) => addItem(acc, k.text), items);
}

export function kitFromItems(items) {
  return normalizeKit(items);
}

export function equipmentSummary(items) {
  const list = normalizeItems(items);
  const packedList = list.filter((i) => i.packed);
  return {
    total: list.length,
    packed: packedList.length,
    returned: packedList.filter((i) => i.returned).length,
    missingReturn: packedList.filter((i) => !i.returned),
    notPacked: list.filter((i) => !i.packed),
  };
}
