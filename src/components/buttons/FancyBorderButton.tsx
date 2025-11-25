"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useSound } from "@/components/providers/SoundContext";

import { motion, HTMLMotionProps } from "framer-motion";

interface FancyBorderButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const FancyBorderButton = React.forwardRef<
  HTMLButtonElement,
  FancyBorderButtonProps
>(
  (
    {
      children,
      className,
      type = "button",
      onClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const { playSound } = useSound();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        playSound("click");
      }
      onClick?.(e);
    };

    return (
      <motion.button
        ref={ref}
        type={type as "button" | "submit" | "reset"}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative flex items-center justify-center h-[54px] px-6",
          "bg-white text-[#191919]",
          "font-body font-normal uppercase tracking-[-0.02em] text-center text-[26px] leading-[115%] align-bottom",
          "w-full",
          "max-w-[361px] mx-auto",
          "rounded-[12px]",
          "border-[5px] border-t-0 border-l-0 border-(--brand-cyan)",
          "transition-colors", // Removed transform transition as motion handles it
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
          className
        )}
        onClick={handleClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

FancyBorderButton.displayName = "FancyBorderButton";
