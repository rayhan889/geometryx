import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 border-[3px] border-black bg-white px-3 text-base font-semibold outline-none placeholder:font-normal placeholder:text-black/40 focus-visible:bg-secondary focus-visible:shadow-hard-sm focus-visible:outline-none disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
