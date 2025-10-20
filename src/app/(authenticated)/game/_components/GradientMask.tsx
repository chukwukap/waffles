"use client";

import Image from "next/image";
import clsx from "clsx";

/**
 * Bottom fade overlay that masks an image (or uses a solid fill if no src).
 *
 * - Sits on top of content (pointer-events: none)
 * - Width is responsive: clamps to container, not fixed Figma px
 * - Height is configurable (defaults to ~136px from the comp)
 *
 * Example:
 * <GradientMask className="bottom-24" src="/noise-bottom.png" />
 */
export default function GradientMask({
  className,
  height = 136,
  src,
  alt = "",
}: {
  className?: string;
  height?: number;
  /** Optional image to “fade”; if omitted we just fade a solid. */
  src?: string;
  alt?: string;
}) {
  return (
    <div
      aria-hidden
      className={clsx(
        "pointer-events-none absolute left-1/2 -translate-x-1/2 w-[min(94vw,40rem)]", // ~377px max but responsive
        className
      )}
      style={{ height }}
    >
      {src ? (
        <div className="relative h-full w-full">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 94vw, 40rem"
            className={clsx(
              "object-cover",
              // Mask the image so it fades in (transparent → opaque) towards the bottom.
              "[mask-image:linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_6%,rgba(0,0,0,1)_100%)]",
              "[-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_6%,rgba(0,0,0,1)_100%)]"
            )}
            priority
          />
        </div>
      ) : (
        // Fallback: just fade a solid surface to the page background.
        <div
          className={clsx(
            "h-full w-full",
            "[mask-image:linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_6%,rgba(0,0,0,1)_100%)]",
            "[-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_6%,rgba(0,0,0,1)_100%)]",
            "bg-background"
          )}
        />
      )}
    </div>
  );
}
