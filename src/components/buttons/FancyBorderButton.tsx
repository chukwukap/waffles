"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FancyBorderButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode; // Button content
  fullWidth?: boolean; // Option to make button full width (default: true)
  // Allow ref forwarding
  // ref?: React.RefObject<HTMLButtonElement>; // Ref forwarding handled by React.forwardRef
}

/**
 * A custom button component with a distinctive "fancy" border effect,
 * appearing thicker on the bottom and right. Uses theme colors.
 */
export const FancyBorderButton = React.forwardRef<
  HTMLButtonElement,
  FancyBorderButtonProps
>(
  (
    { children, fullWidth = true, className, type = "button", ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type} // Set button type
        className={cn(
          "relative flex items-center justify-center h-[54px] px-6",
          "bg-white text-[#191919]",
          "font-body uppercase tracking-wider text-sm",
          "max-w-sm mx-auto",
          "rounded-[12px]",
          "border-[5px] border-t-0 border-l-0 border-(--brand-cyan)",
          fullWidth && "w-full",
          "transition-transform active:translate-y-[2px] active:border-b-[3px] active:border-r-[3px]",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0 disabled:active:border-b-[5px] disabled:active:border-r-[5px]",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

// Assign display name for DevTools
FancyBorderButton.displayName = "FancyBorderButton";
