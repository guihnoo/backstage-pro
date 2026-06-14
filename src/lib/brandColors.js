import { getCategoryConfig } from '@/lib/categoryConfig';
import { AUTH_HERO_CATEGORY } from '@/lib/categoryGear';

export const BRAND_COLOR_PALETTE = [
  { id: 'cyan', hex: '#22d3ee', label: 'Ciano' },
  { id: 'purple', hex: '#A64AFF', label: 'Roxo' },
  { id: 'gold', hex: '#EAB308', label: 'Ouro' },
  { id: 'green', hex: '#22c55e', label: 'Verde' },
  { id: 'rose', hex: '#f43f5e', label: 'Rosa' },
  { id: 'orange', hex: '#f97316', label: 'Laranja' },
  { id: 'blue', hex: '#3b82f6', label: 'Azul' },
  { id: 'violet', hex: '#8b5cf6', label: 'Violeta' },
  { id: 'teal', hex: '#14b8a6', label: 'Turquesa' },
  { id: 'pink', hex: '#ec4899', label: 'Pink' },
  { id: 'lime', hex: '#84cc16', label: 'Lima' },
  { id: 'indigo', hex: '#6366f1', label: 'Índigo' },
];

export const DEFAULT_EVENT_COLOR = getCategoryConfig(AUTH_HERO_CATEGORY).primaryHex;
export const DEFAULT_CLIENT_COLOR = '#A64AFF';

export function pickDefaultClientColor(seed = '') {
  const text = String(seed).trim().toLowerCase();
  if (!text) return DEFAULT_CLIENT_COLOR;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BRAND_COLOR_PALETTE[Math.abs(hash) % BRAND_COLOR_PALETTE.length].hex;
}

export function resolveEventColor(event, clientOrClients) {
  const client = Array.isArray(clientOrClients)
    ? clientOrClients.find((c) => c?.id === event?.client_id)
    : clientOrClients;

  return client?.brand_color || event?.color || DEFAULT_EVENT_COLOR;
}
