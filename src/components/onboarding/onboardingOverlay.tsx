"use client";

import Image from "next/image";
import { OnboardingCarousel } from "./onboarding-carousel";

interface OnboardingOverlayProps {
  onComplete: () => void;
}

/**
 * Full-screen onboarding overlay that reuses the existing onboarding UI.
 * Renders above the app and blocks interaction until completion.
 */
export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-figma noise flex flex-col">
      <div className="p-10 flex items-center justify-center">
        <Image
          src="/logo-icon.png"
          alt="Logo"
          width={150}
          height={80}
          priority
        />
      </div>
      <div className="flex-1">
        <OnboardingCarousel onComplete={onComplete} />
      </div>
    </div>
  );
}
