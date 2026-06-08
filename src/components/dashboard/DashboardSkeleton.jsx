import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 bg-slate-800" />
          <Skeleton className="h-4 w-32 sm:w-48 bg-slate-800" />
        </div>
        <Skeleton className="h-10 sm:h-11 w-full sm:w-[200px] bg-slate-800" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 bg-slate-800" />
                  <Skeleton className="h-6 sm:h-8 w-20 sm:w-28 bg-slate-800" />
                </div>
                <Skeleton className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-slate-800" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
        {/* Chart Skeleton */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-40 bg-slate-800" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full bg-slate-800" />
            </CardContent>
          </Card>
        </div>

        {/* Events List Skeleton */}
        <div>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-36 bg-slate-800" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full bg-slate-800" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 md:gap-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-44 bg-slate-800" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-24 w-full bg-slate-800" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}