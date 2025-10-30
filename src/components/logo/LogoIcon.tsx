import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Renders the Waffles icon logo (text version).
 * Acts as a simple wrapper around the next/image component.
 * Accepts standard div props like className for flexible styling.
 */
export default function LogoIcon({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative w-[148px] h-[60px]", className)} {...props}>
      <Image
        src="/logo-onboarding.png"
        alt="Waffles logo icon"
        fill
        sizes="(max-width: 640px) 148px, 148px"
        priority
        className="object-contain"
      />
    </div>
  );
}
