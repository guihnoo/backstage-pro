import { getCategoryConfig } from './categoryConfig';

export const AUTH_HERO_CATEGORY = 'lighting';
export const AUTH_HERO_THEME = getCategoryConfig(AUTH_HERO_CATEGORY);
export const AUTH_HERO_PRIMARY = AUTH_HERO_THEME.primaryHex;
export const AUTH_HERO_ACCENT = AUTH_HERO_THEME.accentHex;

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
