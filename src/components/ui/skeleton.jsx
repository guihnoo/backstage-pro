import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-md bg-[length:200%_100%] animate-shimmer",
        "bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-800/80",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
