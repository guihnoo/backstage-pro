import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-md bg-[length:200%_100%] animate-shimmer",
        // Cinza do visual All Access (antes era azul-ardosia).
        "bg-gradient-to-r from-[#1a1a1a] via-[#262626] to-[#1a1a1a]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
