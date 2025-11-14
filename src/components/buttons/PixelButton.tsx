"use client";

import * as React from "react";
import { cn } from "@/lib/utils"; // Assuming a utility like tailwind-merge

interface PixelButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  borderWidth?: number; // Border width in pixels
}

const PixelButton = React.forwardRef<HTMLButtonElement, PixelButtonProps>(
  (
    {
      className,
      children,
      backgroundColor = "#000000",
      borderColor = "#FFC931",
      textColor = "#FFD972",
      borderWidth = 4, // Default to a 4px border
      ...props
    },
    ref
  ) => {
    const containerStyle = {
      backgroundColor: borderColor,
      padding: `${borderWidth}px`,
    };

    const buttonStyle = {
      backgroundColor: backgroundColor,
      color: textColor,
    };

    return (
      <div
        style={containerStyle}
        className={cn(
          // This is now a full-width block by default to fill its container
          "pixel-corners w-full transition-transform duration-100 ease-in-out",
          // Apply hover/active states to the container to move the whole unit
          "hover:-translate-y-0.5 active:translate-y-0"
        )}
      >
        <button
          style={buttonStyle}
          className={cn(
            "pixel-corners flex h-full w-full items-center justify-center px-6 py-3 font-display text-[14px] uppercase tracking-wider",
            "disabled:cursor-not-allowed disabled:opacity-60",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </button>
      </div>
    );
  }
);

PixelButton.displayName = "PixelButton";

export { PixelButton };
