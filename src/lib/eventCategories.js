export const CATEGORIES = [
  {
    id: 'audio',
    label: 'Técnico de Som',
    icon: 'Sliders',
    color: 'cyan',
    specialties: ['PA/FOH', 'Monitor/IEM', 'RF/Wireless', 'Estúdio', 'Broadcast', 'AV Corporativo']
  },
  {
    id: 'lighting',
    label: 'Iluminação',
    icon: 'Sun',
    color: 'amber',
    specialties: ['Moving Head', 'LED/PIXEL', 'Strobo', 'Console MA2', 'Console GrandMA3', 'Laser']
  },
  {
    id: 'video',
    label: 'Vídeo/Projeção',
    icon: 'Video',
    color: 'violet',
    specialties: ['Projeção Mapeada', 'LED Wall', 'Câmera ao Vivo', 'VJ', 'Streaming', 'Edição']
  },
  {
    id: 'production',
    label: 'Produção',
    icon: 'ClipboardList',
    color: 'green',
    specialties: ['Produção Executiva', 'Coordenação', 'Rider Técnico', 'Logística', 'Diretor de Palco']
  },
  {
    id: 'stage',
    label: 'Palco/Rigging',
    icon: 'Wrench',
    color: 'orange',
    specialties: ['Montagem de Palco', 'Rigging', 'Carpintaria', 'Estrutura Treliça', 'Backline']
  },
  {
    id: 'photo',
    label: 'Fotografia',
    icon: 'Camera',
    color: 'pink',
    specialties: ['Making Of', 'Cobertura ao Vivo', 'Press', 'Social Media', 'Retratos']
  },
  {
    id: 'dj',
    label: 'DJ / Música',
    icon: 'Music2',
    color: 'purple',
    specialties: ['DJ', 'VJ', 'Músico', 'Sonoplasta', 'Produtor Musical']
  },
  {
    id: 'art',
    label: 'Cenografia/Arte',
    icon: 'Palette',
    color: 'red',
    specialties: ['Cenógrafo', 'Diretor de Arte', 'Figurinista', 'Maquiagem', 'Adereços']
  },
  {
    id: 'catering',
    label: 'Hospitalidade',
    icon: 'UtensilsCrossed',
    color: 'yellow',
    specialties: ['Catering', 'Bartender', 'Hostess/Recepcionist', 'Chef', 'Garçom']
  },
  {
    id: 'security',
    label: 'Segurança',
    icon: 'ShieldCheck',
    color: 'slate',
    specialties: ['Segurança Pessoal', 'Coord. de Acesso', 'Controle de Crowd', 'Portaria VIP']
  }
];

export const getIconComponent = (iconName) => {
  const icons = {
    'Sliders': '🎚️',
    'Sun': '☀️',
    'Video': '🎥',
    'ClipboardList': '📋',
    'Wrench': '🔧',
    'Camera': '📸',
    'Music2': '🎵',
    'Palette': '🎨',
    'UtensilsCrossed': '🍽️',
    'ShieldCheck': '🛡️'
  };
  return icons[iconName] || '✨';
};
