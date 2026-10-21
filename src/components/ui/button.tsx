import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 border-[3px] border-black text-sm font-extrabold whitespace-nowrap shadow-hard-sm transition-[transform,box-shadow] select-none hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:border-black/30 disabled:bg-muted disabled:text-black/40 disabled:shadow-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-black text-white",
        outline: "bg-white text-black hover:bg-muted",
        secondary: "bg-secondary text-black",
        blue: "bg-volume text-white",
        destructive: "bg-destructive text-white",
        ghost: "border-transparent bg-transparent shadow-none hover:translate-x-0 hover:translate-y-0 hover:border-black hover:bg-white hover:shadow-none active:translate-x-0 active:translate-y-0",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-6 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "outline", size: "default" },
  }
)

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button }
