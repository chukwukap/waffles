"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FancyBorderButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
  ref?: React.RefObject<HTMLButtonElement>;
}

export function FancyBorderButton({
  ref,
  children,
  fullWidth = true,
  className,
  ...props
}: FancyBorderButtonProps) {
  return (
    <button
      ref={ref}
      className={cn(
        "relative flex items-center justify-center h-[54px] px-6 bg-white text-[#191919] font-[var(--font-pixel)] text-sm uppercase tracking-wider max-w-sm mx-auto",
        "rounded-[12px] border-[5px] border-t-0 border-l-0 border-[#00CFF2]",
        fullWidth && "w-full",
        "transition-all active:translate-y-[1px]",
        "disabled:cursor-not-allowed disabled:opacity-50 ",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
