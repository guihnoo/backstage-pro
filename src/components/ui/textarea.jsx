import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[72px] w-full rounded-[12px] border border-[#333333] bg-[#0a0a0a] px-3.5 py-3 text-base text-white shadow-none placeholder:text-[#666666] focus-visible:outline-none focus-visible:border-[#ffd400] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
