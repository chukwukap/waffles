"use client";

import * as React from "react";
import { cn } from "@/lib/utils"; // Assuming a utility like tailwind-merge
import { useSound } from "@/components/providers/SoundContext";

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
      onClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const { playSound } = useSound();

    const containerStyle = {
      backgroundColor: borderColor,
      padding: `${borderWidth}px`,
    };

    const buttonStyle = {
      backgroundColor: backgroundColor,
      color: textColor,
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        playSound("click");
      }
      onClick?.(e);
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
            "pixel-corners flex h-full w-full items-center justify-center px-6 py-3 font-display text-[14px]  tracking-wider",
            "disabled:cursor-not-allowed disabled:opacity-60",
            className
          )}
          ref={ref}
          onClick={handleClick}
          disabled={disabled}
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
