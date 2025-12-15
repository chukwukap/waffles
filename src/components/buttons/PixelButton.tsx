"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { springs, tapScale } from "@/lib/animations";

interface PixelButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  borderWidth?: number;
}

const PixelButton = React.forwardRef<HTMLButtonElement, PixelButtonProps>(
  (
    {
      className,
      children,
      backgroundColor = "#000000",
      borderColor = "#FFC931",
      textColor = "#FFD972",
      borderWidth = 4,
      onClick,
      disabled,
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
      <motion.div
        style={containerStyle}
        whileTap={disabled ? undefined : tapScale}
        transition={springs.snappy}
        className={cn(
          "pixel-corners w-full",
          disabled && "opacity-60"
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
          onClick={onClick}
          disabled={disabled}
          {...props}
        >
          {children}
        </button>
      </motion.div>
    );
  }
);

PixelButton.displayName = "PixelButton";

export { PixelButton };
