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
      className={cn("fixed inset-0 z-81 flex flex-col", "bg-[#191919]")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="flex shrink-0 items-center justify-center p-6 sm:p-8">
        <h1 id="onboarding-title" className="sr-only">
          Onboarding
        </h1>
        <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-96 md:h-96">
          <Image
            src="/logo-onboarding.png"
            alt="Waffles Logo"
            fill
            sizes="(max-width: 640px) 224px, (max-width: 768px) 288px, 384px"
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
