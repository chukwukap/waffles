// components/ui/pixel-input.tsx
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function PixelInput({ className, ...props }: PixelInputProps) {
  return (
    <input
      type="text"
      className={cn(
        "w-full h-14 bg-[#2a2a2a] border-none text-[#a0a0a0] placeholder:text-[#5a5a5a]",
        "text-center font-input text-xl tracking-wider rounded-lg",
        "focus-visible:ring-[#00cff2] focus-visible:ring-2",
        className
      )}
      {...props}
    />
  );
}
