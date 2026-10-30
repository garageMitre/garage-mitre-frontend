import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background transition-colors placeholder:text-muted-foreground/70 hover:border-muted-foreground/40 focus-visible:border-yellow-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/25 focus-visible:ring-offset-0 aria-[invalid=true]:border-red-500/60 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
