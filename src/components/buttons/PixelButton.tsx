"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PixelButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  backgroundColor?: string; // e.g., '#00CFF2'
  borderColor?: string; // e.g., '#000000'
  textColor?: string; // e.g., '#FFFFFF'
}

export function PixelButton({
  children,
  icon,
  className,
  ...props
}: PixelButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex w-full max-w-sm items-center justify-center gap-2 px-6 py-3 text-sm font-[var(--font-pixel)] uppercase tracking-wider transition-all duration-200 select-none active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed",
        pixelClipPath,
        "transition-all active:translate-y-[1px]",
        className
      )}
      {...props}
    >
      {icon && <span className="inline-block">{icon}</span>}
      {children}
    </button>
  );
}

const pixelClipPath =
  "[clip-path:polygon(0_12px,6px_12px,6px_6px,12px_6px,12px_0,calc(100%-12px)_0,calc(100%-12px)_6px,calc(100%-6px)_6px,calc(100%-6px)_12px,100%_12px,100%_calc(100%-12px),calc(100%-6px)_calc(100%-12px),calc(100%-6px)_calc(100%-6px),calc(100%-12px)_calc(100%-6px),calc(100%-12px)_100%,12px_100%,12px_calc(100%-6px),6px_calc(100%-6px),6px_calc(100%-12px),0_calc(100%-12px))]";
