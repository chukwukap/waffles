"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useSound } from "@/components/providers/SoundContext";

interface FancyBorderButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
      fullWidth = true,
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
      <button
        ref={ref}
        type={type}
        className={cn(
          "relative flex items-center justify-center h-[54px] px-6",
          "bg-white text-[#191919]",
          "font-body font-normal uppercase tracking-[-0.02em] text-center text-[26px] leading-[115%] align-bottom",

          "max-w-sm mx-auto",
          "rounded-[12px]",
          "border-[5px] border-t-0 border-l-0 border-(--brand-cyan)",
          fullWidth && "w-full",
          "transition-transform active:translate-y-[2px] active:border-b-[3px] active:border-r-[3px]",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0 disabled:active:border-b-[5px] disabled:active:border-r-[5px]",
          className
        )}
        onClick={handleClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

FancyBorderButton.displayName = "FancyBorderButton";
