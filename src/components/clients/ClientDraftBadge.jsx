import { cn } from '@/lib/utils';

export function ClientDraftBadge({ className }) {
  return (
    <span
      className={cn(
        'text-[10px] font-medium uppercase tracking-wide text-[#ffd400] border border-[#ffd400]/40 rounded px-1.5 py-0.5 flex-shrink-0',
        className
      )}
    >
      rascunho
    </span>
  );
}
