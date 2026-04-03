import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-primary text-slate-900 hover:bg-brand-primary/80",
        secondary:
          "border-transparent bg-slate-800 text-slate-100 hover:bg-slate-800/80",
        destructive:
          "border-transparent bg-brand-danger text-slate-100 hover:bg-brand-danger/80",
        success:
          "border-transparent bg-brand-success text-slate-900 hover:bg-brand-success/80",
        warning:
          "border-transparent bg-brand-warning text-slate-900 hover:bg-brand-warning/80",
        outline: "text-slate-100 border-slate-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
