import {
  Music, Lightbulb, Camera, Video, Disc3, Zap,
  Palette, Users, Lock, Utensils
} from 'lucide-react';

export const CATEGORIES = {
  audio: {
    id: 'audio',
    label: 'Técnico de Som',
    emoji: '🎙️',
    description: 'Os ouvidos do palco',
    motivation: 'Sem som, não há show. Você é a alma do evento.',
    icon: Music,
    primaryHex: '#39FF14',
    accentHex: '#00D9FF',
    tailwindPrimary: 'green-400',
    tailwindAccent: 'cyan-400',
    gradient: 'from-green-400 to-cyan-500',
    bgGlow: 'rgba(57, 255, 20, 0.15)',
    borderGlow: 'border-green-400/50 hover:border-green-300 shadow-lg shadow-green-500/20',
    specialties: ['PA/FOH', 'Monitor/IEM', 'RF/Wireless', 'Estúdio', 'Broadcast', 'AV Corporativo']
  },
  lighting: {
    id: 'lighting',
    label: 'Iluminação',
    emoji: '💡',
    description: 'A magia do palco',
    motivation: 'Luz define o clima. Você pinta o palco com cores.',
    icon: Lightbulb,
    primaryHex: '#A64AFF',
    accentHex: '#FFB700',
    tailwindPrimary: 'purple-400',
    tailwindAccent: 'amber-400',
    gradient: 'from-purple-400 to-amber-500',
    bgGlow: 'rgba(166, 74, 255, 0.15)',
    borderGlow: 'border-purple-400/50 hover:border-purple-300 shadow-lg shadow-purple-500/20',
    specialties: ['Moving Head', 'LED/PIXEL', 'Strobo', 'Console MA2', 'Console GrandMA3', 'Laser']
  },
  photo: {
    id: 'photo',
    label: 'Fotografia',
    emoji: '📷',
    description: 'Eterno através da lente',
    motivation: 'Você congela os melhores momentos. A história passa por você.',
    icon: Camera,
    primaryHex: '#FF6B35',
    accentHex: '#00D9FF',
    tailwindPrimary: 'orange-400',
    tailwindAccent: 'cyan-400',
    gradient: 'from-orange-400 to-cyan-500',
    bgGlow: 'rgba(255, 107, 53, 0.15)',
    borderGlow: 'border-orange-400/50 hover:border-orange-300 shadow-lg shadow-orange-500/20',
    specialties: ['Retratos', 'Eventos', 'Produtos', 'Making of', 'Cobertura ao Vivo', 'Press']
  },
  video: {
    id: 'video',
    label: 'Vídeo',
    emoji: '🎬',
    description: 'Realidade em movimento',
    motivation: 'Você transforma momentos em obras visuais. Épico é seu padrão.',
    icon: Video,
    primaryHex: '#FF006E',
    accentHex: '#00D9FF',
    tailwindPrimary: 'pink-500',
    tailwindAccent: 'cyan-400',
    gradient: 'from-pink-500 to-cyan-500',
    bgGlow: 'rgba(255, 0, 110, 0.15)',
    borderGlow: 'border-pink-500/50 hover:border-pink-400 shadow-lg shadow-pink-500/20',
    specialties: ['Gravação', 'Edição', 'Produção', 'VJ', 'Streaming', 'Mapeamento 3D']
  },
  dj: {
    id: 'dj',
    label: 'DJ / Música',
    emoji: '🎧',
    description: 'Maestro das pistas',
    motivation: 'A batida é seu ritmo. Você move multidões.',
    icon: Disc3,
    primaryHex: '#00D9FF',
    accentHex: '#A64AFF',
    tailwindPrimary: 'cyan-400',
    tailwindAccent: 'purple-400',
    gradient: 'from-cyan-400 to-purple-500',
    bgGlow: 'rgba(0, 217, 255, 0.15)',
    borderGlow: 'border-cyan-400/50 hover:border-cyan-300 shadow-lg shadow-cyan-500/20',
    specialties: ['Gigs', 'Produção', 'Mixing', 'Mastering', 'Produção Musical', 'Sonoplasta']
  },
  production: {
    id: 'production',
    label: 'Produção',
    emoji: '📋',
    description: 'General do evento',
    motivation: 'Caos organizado é sua arte. Você faz tudo funcionar.',
    icon: Zap,
    primaryHex: '#FFB700',
    accentHex: '#00D9FF',
    tailwindPrimary: 'amber-400',
    tailwindAccent: 'cyan-400',
    gradient: 'from-amber-400 to-cyan-500',
    bgGlow: 'rgba(255, 183, 0, 0.15)',
    borderGlow: 'border-amber-400/50 hover:border-amber-300 shadow-lg shadow-amber-500/20',
    specialties: ['Coordenação', 'Logística', 'Timeline', 'Orçamento', 'Diretor de Palco', 'Rider Técnico']
  },
  scenography: {
    id: 'scenography',
    label: 'Cenografia',
    emoji: '🎭',
    description: 'Arquiteto da fantasia',
    motivation: 'Você cria universos. O palco é sua tela.',
    icon: Palette,
    primaryHex: '#A64AFF',
    accentHex: '#FF6B35',
    tailwindPrimary: 'purple-400',
    tailwindAccent: 'orange-400',
    gradient: 'from-purple-400 to-orange-500',
    bgGlow: 'rgba(166, 74, 255, 0.15)',
    borderGlow: 'border-purple-400/50 hover:border-purple-300 shadow-lg shadow-purple-500/20',
    specialties: ['Design', 'Construção', 'Arte', 'Figurino', 'Maquiagem', 'Adereços']
  },
  hospitality: {
    id: 'hospitality',
    label: 'Hospitalidade',
    emoji: '🍽️',
    description: 'Curador de experiências',
    motivation: 'Conforto é seu compromisso. Você cuida de cada detalhe.',
    icon: Utensils,
    primaryHex: '#00D9FF',
    accentHex: '#FFB700',
    tailwindPrimary: 'cyan-400',
    tailwindAccent: 'amber-400',
    gradient: 'from-cyan-400 to-amber-500',
    bgGlow: 'rgba(0, 217, 255, 0.15)',
    borderGlow: 'border-cyan-400/50 hover:border-cyan-300 shadow-lg shadow-cyan-500/20',
    specialties: ['Catering', 'Bartender', 'Hostess', 'Chef', 'Garçom', 'Sommelier']
  },
  security: {
    id: 'security',
    label: 'Segurança',
    emoji: '🔒',
    description: 'Guardião da ordem',
    motivation: 'Confiança é sua moeda. Você garante que tudo é seguro.',
    icon: Lock,
    primaryHex: '#FF3333',
    accentHex: '#00D9FF',
    tailwindPrimary: 'red-500',
    tailwindAccent: 'cyan-400',
    gradient: 'from-red-500 to-cyan-500',
    bgGlow: 'rgba(255, 51, 51, 0.15)',
    borderGlow: 'border-red-500/50 hover:border-red-400 shadow-lg shadow-red-500/20',
    specialties: ['Vigilância', 'Turnos', 'Posicionamento', 'Controle de Acesso', 'Crowd Control', 'VIP']
  },
  accommodation: {
    id: 'accommodation',
    label: 'Hospedagem',
    emoji: '🏨',
    description: 'Arquiteto do conforto',
    motivation: 'Descanso é essencial. Você oferece refúgio.',
    icon: Users,
    primaryHex: '#39FF14',
    accentHex: '#FFB700',
    tailwindPrimary: 'green-400',
    tailwindAccent: 'amber-400',
    gradient: 'from-green-400 to-amber-500',
    bgGlow: 'rgba(57, 255, 20, 0.15)',
    borderGlow: 'border-green-400/50 hover:border-green-300 shadow-lg shadow-green-500/20',
    specialties: ['Alojamento', 'Conforto', 'Acomodação VIP', 'Serviço', 'Limpeza', 'Manutenção']
  }
};

export function getCategoryConfig(categoryId) {
  return CATEGORIES[categoryId] || CATEGORIES.lighting;
}

export function getAllCategories() {
  return Object.values(CATEGORIES);
}

export function getCategoryLabel(categoryId) {
  return getCategoryConfig(categoryId)?.label || 'Profissional';
}

export function getCategoryColor(categoryId) {
  return getCategoryConfig(categoryId)?.primaryHex || CATEGORIES.lighting.primaryHex;
}

export function getCategoryEmoji(categoryId) {
  return getCategoryConfig(categoryId)?.emoji || '🎤';
}

export function getCategoryMotivation(categoryId) {
  return getCategoryConfig(categoryId)?.motivation || 'Você é essencial para o evento.';
}
