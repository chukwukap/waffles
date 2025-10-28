"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type PixelInputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * A styled input component with a "pixelated" or retro aesthetic,
 * using theme colors and fonts.
 */
const PixelInput = React.forwardRef<HTMLInputElement, PixelInputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "h-14 w-full rounded-lg border-none px-4 py-2",
          "text-center text-xl tracking-wider",
          "bg-[color:var(--surface-tint)]",
          "text-[color:var(--text-primary)] caret-primary",
          "placeholder:text-[color:var(--text-muted)]",
          "font-input",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "focus-visible:ring-[color:var(--accent-secondary)]",
          "focus-visible:ring-offset-[color:var(--background)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

// Assign display name for DevTools
PixelInput.displayName = "PixelInput";

export { PixelInput };
