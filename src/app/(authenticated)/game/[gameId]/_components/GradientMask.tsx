"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface GradientMaskProps {
  className?: string;
  height?: number;
  src?: string;
  alt?: string;
}

/**
 * Renders a bottom fade overlay using CSS masks.
 * Can mask either a provided image or create a fade-to-background effect.
 * Designed to sit visually on top of other content without blocking interactions.
 */
export default function GradientMask({
  className,
  height = 136,
  src,
  alt = "",
}: GradientMaskProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute left-1/2 -translate-x-1/2 w-[min(94vw,40rem)] z-10",
        className
      )}
      style={{ height: `${height}px` }}
    >
      {src ? (
        <div className="relative h-full w-full">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 94vw, 40rem"
            className={cn(
              "object-cover",

              "mask-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_6%,rgba(0,0,0,1)_100%)]", // Standard mask
              "[-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_6%,rgba(0,0,0,1)_100%)]" // Webkit prefix for compatibility
            )}
            priority
          />
        </div>
      ) : (
        <div
          className={cn(
            "h-full w-full",

            "mask-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_6%,rgba(0,0,0,1)_100%)]",
            "[-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_6%,rgba(0,0,0,1)_100%)]",
            "bg-background"
          )}
        />
      )}
    </div>
  );
} //
