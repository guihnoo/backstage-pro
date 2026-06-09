import { cn } from '@/lib/utils';

export function ClientDraftBadge({ className }) {
  return (
    <span
      className={cn(
        'text-[10px] font-medium uppercase tracking-wide text-amber-400 border border-amber-500/40 rounded px-1.5 py-0.5 flex-shrink-0',
        className
      )}
    >
      rascunho
    </span>
  );
}
