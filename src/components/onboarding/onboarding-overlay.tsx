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
      className={cn("fixed inset-0 z-81 flex flex-col pt-2", "bg-[#191919]")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="flex shrink-0 items-center justify-center p-2">
        <h1 id="onboarding-title" className="sr-only">
          Onboarding
        </h1>
        <div className="relative w-56 h-20 ">
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
