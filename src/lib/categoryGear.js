import { getCategoryConfig } from '@/lib/categoryConfig';

export const AUTH_HERO_CATEGORY = 'lighting';

const _hero = getCategoryConfig(AUTH_HERO_CATEGORY);
export const AUTH_HERO_THEME = _hero;
export const AUTH_HERO_PRIMARY = _hero.primaryHex;
export const AUTH_HERO_ACCENT = _hero.accentHex;
/** CSS vars para páginas públicas (login/signup) sem AppLayout */
export const AUTH_HERO_CSS_VARS = {
  '--bp-primary': AUTH_HERO_PRIMARY,
  '--bp-accent': AUTH_HERO_ACCENT,
  '--bp-glow': _hero.bgGlow,
};

const GEAR_BY_CATEGORY = {
  lighting: ['💡', '🔦', '🎛️', '✨', '🌈', '🔌', '📡', '⚡', '🎭', '🪩', '💜', '🟡'],
  audio: ['🎚️', '🎙️', '🔊', '🎧', '📡', '🔌', '🎛️', '📻', '🎤', '🔉', '🎵', '📺'],
  photo: ['📷', '📸', '🔦', '💾', '🖼️', '🎬', '✨', '🔌', '📡', '🎭', '🌟', '📱'],
  video: ['🎬', '📹', '🎥', '🖥️', '📡', '🔌', '🎛️', '💡', '🎭', '📺', '✨', '🎧'],
  dj: ['🎧', '💿', '🎛️', '🔊', '✨', '🪩', '💜', '🔌', '📡', '🎵', '⚡', '🎤'],
  default: ['🎚️', '🎙️', '📷', '💡', '🔊', '📺', '🎬', '🎛️', '🔌', '🎭', '📡', '🎧'],
};

export function getGearForCategory(categoryId) {
  return GEAR_BY_CATEGORY[categoryId] || GEAR_BY_CATEGORY.default;
}
