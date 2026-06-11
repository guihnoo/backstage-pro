import { cn } from '@/lib/utils';

/** Uma linha com reticências; use title nativo para ver texto completo no hover/long-press. */
export function Ellipsis({ children, className, as: Tag = 'span', title }) {
  const tip = title ?? (typeof children === 'string' ? children : undefined);
  return (
    <Tag className={cn('block min-w-0 truncate', className)} title={tip}>
      {children}
    </Tag>
  );
}

/** Texto longo em blocos (descrição, notas) — quebra palavras e limita linhas. */
export function ClampedText({ children, lines = 4, className, title }) {
  const tip = title ?? (typeof children === 'string' ? children : undefined);
  const clampClass =
    lines === 1 ? 'truncate' : lines === 2 ? 'line-clamp-2' : lines === 3 ? 'line-clamp-3' : 'line-clamp-4';

  return (
    <p className={cn('min-w-0 break-words overflow-hidden', clampClass, className)} title={tip}>
      {children}
    </p>
  );
}
