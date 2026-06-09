import { getEventDisplay } from '@/lib/eventDisplay';

export default function EventHeading({ event, client, size = 'md', className = '' }) {
  const { companyName, eventName, showEventSubtitle } = getEventDisplay(event, client);

  const titleClass =
    size === 'lg'
      ? 'text-xl sm:text-2xl font-bold text-white leading-tight'
      : size === 'sm'
        ? 'text-sm font-bold text-white leading-tight'
        : 'text-base sm:text-lg font-bold text-white leading-tight';

  const subtitleClass = size === 'lg' ? 'text-sm text-slate-400 mt-1' : 'text-xs text-slate-400 mt-0.5';

  return (
    <div className={`min-w-0 ${className}`}>
      <p className={`${titleClass} truncate`}>{companyName}</p>
      {showEventSubtitle && <p className={`${subtitleClass} truncate`}>{eventName}</p>}
    </div>
  );
}
