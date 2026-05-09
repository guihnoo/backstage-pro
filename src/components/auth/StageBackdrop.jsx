export default function StageBackdrop() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: 0.15 }}
    >
      <defs>
        <linearGradient id="stageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Treliça de ferro no topo */}
      <g id="truss">
        <line x1="100" y1="50" x2="1100" y2="50" stroke="url(#stageGradient)" strokeWidth="3" />
        <line x1="150" y1="40" x2="150" y2="100" stroke="url(#stageGradient)" strokeWidth="2" />
        <line x1="250" y1="40" x2="250" y2="100" stroke="url(#stageGradient)" strokeWidth="2" />
        <line x1="350" y1="40" x2="350" y2="100" stroke="url(#stageGradient)" strokeWidth="2" />
        <line x1="450" y1="40" x2="450" y2="100" stroke="url(#stageGradient)" strokeWidth="2" />
        <line x1="550" y1="40" x2="550" y2="100" stroke="url(#stageGradient)" strokeWidth="2" />
        <line x1="650" y1="40" x2="650" y2="100" stroke="url(#stageGradient)" strokeWidth="2" />
        <line x1="750" y1="40" x2="750" y2="100" stroke="url(#stageGradient)" strokeWidth="2" />
        <line x1="850" y1="40" x2="850" y2="100" stroke="url(#stageGradient)" strokeWidth="2" />
        <line x1="950" y1="40" x2="950" y2="100" stroke="url(#stageGradient)" strokeWidth="2" />
        <line x1="1050" y1="40" x2="1050" y2="100" stroke="url(#stageGradient)" strokeWidth="2" />
      </g>

      {/* Holofotes pendurados */}
      <g id="spotlights" filter="url(#glow)">
        <circle cx="200" cy="70" r="12" fill="#f59e0b" opacity="0.8" />
        <circle cx="400" cy="60" r="12" fill="#a78bfa" opacity="0.8" />
        <circle cx="600" cy="75" r="12" fill="#22d3ee" opacity="0.8" />
        <circle cx="800" cy="65" r="12" fill="#f59e0b" opacity="0.8" />
        <circle cx="1000" cy="70" r="12" fill="#a78bfa" opacity="0.8" />
      </g>

      {/* Palco */}
      <rect x="150" y="300" width="900" height="300" fill="none" stroke="url(#stageGradient)" strokeWidth="4" opacity="0.6" />

      {/* Borda do palco iluminada */}
      <rect x="150" y="295" width="900" height="8" fill="url(#stageGradient)" opacity="0.7" />

      {/* Caixas de som sub (esquerda) */}
      <g id="speakers-left">
        <rect x="80" y="450" width="40" height="80" fill="none" stroke="url(#stageGradient)" strokeWidth="2" />
        <line x1="85" y1="455" x2="115" y2="485" stroke="url(#stageGradient)" strokeWidth="1" opacity="0.5" />
        <circle cx="100" cy="490" r="15" fill="none" stroke="url(#stageGradient)" strokeWidth="1.5" />
      </g>

      {/* Caixas de som sub (direita) */}
      <g id="speakers-right">
        <rect x="1080" y="450" width="40" height="80" fill="none" stroke="url(#stageGradient)" strokeWidth="2" />
        <line x1="1085" y1="455" x2="1115" y2="485" stroke="url(#stageGradient)" strokeWidth="1" opacity="0.5" />
        <circle cx="1100" cy="490" r="15" fill="none" stroke="url(#stageGradient)" strokeWidth="1.5" />
      </g>

      {/* Rack de equipamentos (esquerda) */}
      <g id="rack-left">
        <rect x="50" y="150" width="50" height="150" fill="none" stroke="url(#stageGradient)" strokeWidth="2" opacity="0.7" />
        <line x1="50" y1="170" x2="100" y2="170" stroke="url(#stageGradient)" strokeWidth="1" opacity="0.5" />
        <line x1="50" y1="190" x2="100" y2="190" stroke="url(#stageGradient)" strokeWidth="1" opacity="0.5" />
        <line x1="50" y1="210" x2="100" y2="210" stroke="url(#stageGradient)" strokeWidth="1" opacity="0.5" />
        <line x1="50" y1="230" x2="100" y2="230" stroke="url(#stageGradient)" strokeWidth="1" opacity="0.5" />
        <line x1="50" y1="250" x2="100" y2="250" stroke="url(#stageGradient)" strokeWidth="1" opacity="0.5" />
      </g>

      {/* Rack de equipamentos (direita) */}
      <g id="rack-right">
        <rect x="1100" y="150" width="50" height="150" fill="none" stroke="url(#stageGradient)" strokeWidth="2" opacity="0.7" />
        <line x1="1100" y1="170" x2="1150" y2="170" stroke="url(#stageGradient)" strokeWidth="1" opacity="0.5" />
        <line x1="1100" y1="190" x2="1150" y2="190" stroke="url(#stageGradient)" strokeWidth="1" opacity="0.5" />
        <line x1="1100" y1="210" x2="1150" y2="210" stroke="url(#stageGradient)" strokeWidth="1" opacity="0.5" />
        <line x1="1100" y1="230" x2="1150" y2="230" stroke="url(#stageGradient)" strokeWidth="1" opacity="0.5" />
        <line x1="1100" y1="250" x2="1150" y2="250" stroke="url(#stageGradient)" strokeWidth="1" opacity="0.5" />
      </g>

      {/* Público (silhuetas) */}
      <g id="audience" opacity="0.3">
        <circle cx="300" cy="700" r="15" fill="url(#stageGradient)" />
        <circle cx="350" cy="720" r="12" fill="url(#stageGradient)" />
        <circle cx="400" cy="710" r="14" fill="url(#stageGradient)" />
        <circle cx="500" cy="725" r="13" fill="url(#stageGradient)" />
        <circle cx="600" cy="715" r="15" fill="url(#stageGradient)" />
        <circle cx="700" cy="730" r="12" fill="url(#stageGradient)" />
        <circle cx="800" cy="720" r="14" fill="url(#stageGradient)" />
        <circle cx="900" cy="735" r="13" fill="url(#stageGradient)" />
      </g>
    </svg>
  );
}
