import { useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

function SectionFrame({ primary, label, children }) {
  return (
    <div
      className="relative mb-6 rounded-[18px] overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(22,25,35,.55), rgba(12,14,20,.45))',
        border: `1px solid ${primary}22`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${primary}44, transparent)` }} />
      {label && <div className="px-4 pt-3 pb-1"><span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: `${primary}99` }}>{label}</span></div>}
      <div className="p-4">{children}</div>
    </div>
  );
}

function HomeSkeleton({ primary }) {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-1 animate-in fade-in duration-200">
      {/* header */}
      <div className="px-0 pt-2 pb-6 flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-3 w-36 rounded" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <SectionFrame primary={primary} label="Palco">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
            <Skeleton className="w-16 h-6 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0,1,2].map(i => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-2.5 w-10 rounded" />
                <Skeleton className="h-4 w-full rounded" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
      </SectionFrame>
      <SectionFrame primary={primary} label="Financeiro">
        <div className="space-y-3">
          {[0,1].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
              <Skeleton className="w-20 h-7 rounded-lg" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
      </SectionFrame>
      <SectionFrame primary={primary} label="Agenda">
        <div className="space-y-3">
          {[0,1,2,3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-2 h-2 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 rounded" style={{ width: `${68 - i * 7}%` }} />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <Skeleton className="w-14 h-5 rounded-full" />
            </div>
          ))}
        </div>
      </SectionFrame>
    </div>
  );
}

function CalendarSkeleton({ primary }) {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-7 w-36 rounded" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[0,1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      {/* Calendar grid */}
      <div className="rounded-xl overflow-hidden border border-slate-800/50">
        <div className="grid grid-cols-7 gap-px bg-slate-800/30 p-3">
          {['D','S','T','Q','Q','S','S'].map((d,i) => (
            <div key={i} className="text-center pb-2">
              <Skeleton className="h-3 w-4 mx-auto rounded" />
            </div>
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" style={{ opacity: 0.3 + (i % 5) * 0.1 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ListSkeleton({ primary, rows = 6, hasHeader = true, hasSearch = true }) {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5 animate-in fade-in duration-200">
      {hasHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40 rounded" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      )}
      {hasSearch && <Skeleton className="h-10 w-full rounded-xl" />}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(22,25,35,.5)', border: '1px solid rgba(255,255,255,.04)' }}
          >
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <Skeleton className="h-4 rounded" style={{ width: `${55 + (i % 3) * 12}%` }} />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <div className="shrink-0 space-y-1.5 text-right">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-px w-full opacity-20 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${primary}60, transparent)` }} />
    </div>
  );
}

function ReportsSkeleton({ primary }) {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40 rounded" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      {/* Tab bar */}
      <div className="flex gap-2 overflow-hidden">
        {[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-9 rounded-lg flex-shrink-0" style={{ width: `${50 + i * 4}px` }} />)}
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        {[0,1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

const ROUTE_SKELETON = {
  '/':          (primary) => <HomeSkeleton primary={primary} />,
  '/calendar':  (primary) => <CalendarSkeleton primary={primary} />,
  '/reports':   (primary) => <ReportsSkeleton primary={primary} />,
  '/clients':   (primary) => <ListSkeleton primary={primary} rows={5} />,
  '/expenses':  (primary) => <ListSkeleton primary={primary} rows={4} hasSearch={false} />,
  '/goals':     (primary) => <ListSkeleton primary={primary} rows={3} hasSearch={false} />,
  '/profile':   (primary) => <ListSkeleton primary={primary} rows={4} hasSearch={false} hasHeader={false} />,
  '/ai-mentor': (primary) => <ListSkeleton primary={primary} rows={3} hasSearch={false} hasHeader={false} />,
};

export default function RouteSkeleton() {
  const { pathname } = useLocation();
  const theme = useCategoryTheme();
  const renderFn = ROUTE_SKELETON[pathname] ?? ((p) => <ListSkeleton primary={p} />);

  return (
    <div
      className="min-h-full bg-[#050609] text-white overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Carregando página"
      style={theme.cssVars}
    >
      <span className="sr-only">Carregando...</span>
      {renderFn(theme.primaryHex)}
    </div>
  );
}
