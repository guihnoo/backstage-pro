import { useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

function HomeRouteSkeleton({ primaryHex }) {
  return (
    <div className="min-h-full max-w-2xl mx-auto px-4 pb-8 animate-in fade-in duration-200">
      <div
        className="rounded-b-2xl -mx-4 px-4 pt-4 pb-6 mb-6"
        style={{
          background: `linear-gradient(180deg, #11131c 0%, #050609 100%)`,
        }}
      >
        <Skeleton className="h-3 w-24 rounded-full bg-slate-800/70 mb-4" />
        <Skeleton className="h-8 w-56 max-w-full rounded-lg bg-slate-800/70 mb-2" />
        <Skeleton className="h-4 w-40 rounded-md bg-slate-800/50" />
        <div
          className="h-0.5 w-full mt-5 rounded-full opacity-40"
          style={{ background: `linear-gradient(90deg, transparent, ${primaryHex}, transparent)` }}
        />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-2xl bg-slate-800/60" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl bg-slate-800/50" />
          <Skeleton className="h-20 rounded-xl bg-slate-800/50" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl bg-slate-800/50" />
        <Skeleton className="h-40 w-full rounded-xl bg-slate-800/50" />
      </div>
    </div>
  );
}

function DefaultRouteSkeleton({ primaryHex }) {
  return (
    <div className="min-h-full max-w-2xl mx-auto px-4 py-6 space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-40 rounded-lg bg-slate-800/70" />
        <Skeleton className="h-9 w-9 rounded-full bg-slate-800/60" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl bg-slate-800/50" />
      <Skeleton className="h-32 w-full rounded-2xl bg-slate-800/60" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-800/45" />
        ))}
      </div>
      <div
        className="h-px w-full opacity-30"
        style={{ background: `linear-gradient(90deg, transparent, ${primaryHex}50, transparent)` }}
      />
    </div>
  );
}

export default function RouteSkeleton() {
  const { pathname } = useLocation();
  const theme = useCategoryTheme();
  const isHome = pathname === '/' || pathname === '';

  return (
    <div
      className="min-h-full bg-[#050609] text-white"
      role="status"
      aria-live="polite"
      aria-label="Carregando página"
      style={theme.cssVars}
    >
      <span className="sr-only">Carregando...</span>
      {isHome ? (
        <HomeRouteSkeleton primaryHex={theme.primaryHex} />
      ) : (
        <DefaultRouteSkeleton primaryHex={theme.primaryHex} />
      )}
    </div>
  );
}
