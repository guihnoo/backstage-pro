/**
 * Rosto do Roadie: credencial de bastidor (fita rosa + crachá com faixa amarela e um "R"),
 * no mesmo desenho da logo do app. SVG puro, sem fonte externa.
 */
export default function RoadieAvatar({ size = 48, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" className={className} aria-hidden="true">
      <circle cx="28" cy="28" r="28" fill="#0a0a0a" />
      <rect x="25" y="2" width="6" height="14" rx="1.5" fill="#ff2e88" />
      <rect x="12" y="12" width="32" height="38" rx="6" fill="#f4f4f4" />
      <rect x="23" y="15" width="10" height="2.5" rx="1.25" fill="#0a0a0a" opacity="0.25" />
      <path d="M22 21h8.5a5.5 5.5 0 0 1 1.6 10.75L36 38h-4.6l-3.4-5.8H26V38h-4z M26 24.5v4.2h4.3a2.1 2.1 0 0 0 0-4.2z" fill="#0a0a0a" />
      <rect x="12" y="40" width="32" height="5" fill="#ffd400" />
    </svg>
  );
}
