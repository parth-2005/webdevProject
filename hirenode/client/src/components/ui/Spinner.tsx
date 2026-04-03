import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/utils/cn"

interface SpinnerProps extends React.SVGAttributes<SVGElement> {
  size?: "sm" | "md" | "lg" | "xl"
}

const spinnerSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-brand-primary", spinnerSizes[size], className)}
      {...props}
    />
  )
}
