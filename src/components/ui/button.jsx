import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// Visual All Access: pilulas, amarelo #ffd400 com texto preto, rosa para apagar.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-extrabold transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd400] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#ffd400] text-[#0a0a0a] hover:bg-[#ffe033]",
        destructive:
          "bg-[#ff2e88] text-[#0a0a0a] hover:bg-[#ff4d9c]",
        outline:
          "border border-[#444444] bg-transparent text-white hover:bg-[#222222]",
        secondary:
          "bg-[#222222] text-white hover:bg-[#2a2a2a]",
        ghost: "hover:bg-[#222222] hover:text-white",
        link: "text-[#ffd400] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
