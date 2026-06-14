export const AUTH_HERO_CATEGORY = 'lighting';

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
