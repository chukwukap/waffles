import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

export interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
}

export const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

    const variants = {
      primary: "bg-waffle-gold text-primary-foreground hover:brightness-110 active:scale-95",
      secondary: "bg-neon-purple text-secondary-foreground hover:brightness-110 active:scale-95",
      outline: "border-2 border-waffle-gold text-waffle-gold hover:bg-waffle-gold hover:text-primary-foreground",
      ghost: "text-foreground hover:bg-muted",
    }

    const sizes = {
      sm: "px-4 py-2 text-sm rounded-md",
      md: "px-6 py-3 text-base rounded-lg",
      lg: "px-8 py-4 text-lg rounded-xl",
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], isLoading && "cursor-wait", className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    )
  },
)

PixelButton.displayName = "PixelButton"
