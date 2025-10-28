"use client";

import Image from "next/image";
import { OnboardingCarousel } from "./onboarding-carousel";
import { cn } from "@/lib/utils";

interface OnboardingOverlayProps {
  onComplete: () => void;
}

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  return (
    <div
      className={cn("fixed inset-0 z-[500] flex flex-col", "bg-figma noise")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="flex shrink-0 items-center justify-center p-6 sm:p-8 border-b border-white/10 bg-black/10">
        <h1 id="onboarding-title" className="sr-only">
          Onboarding
        </h1>
        <div className="relative h-[40px] w-[100px]">
          <Image
            src="/logo-icon.png"
            alt="Waffles Logo"
            fill
            sizes="100px"
            priority
            className="object-contain"
          />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <OnboardingCarousel onComplete={onComplete} />
      </div>
    </div>
  );
}
