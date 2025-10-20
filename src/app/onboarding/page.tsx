"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingCarousel } from "./_components/onboarding-carousel";
import Image from "next/image";
export default function OnboardingPage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  const handleComplete = () => {
    router.push("/lobby/invite-code");
  };

  if (showSplash) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="animate-slide-up flex flex-col items-center justify-center">
          <Image
            src="/images/splash-icon.png"
            alt="Splash Icon"
            width={100}
            height={100}
            priority
            className="mb-8"
          />

          <button
            onClick={() => setShowSplash(false)}
            className="w-full px-8 py-4 bg-waffle-gold text-primary-foreground font-bold text-lg rounded-xl hover:brightness-110 transition-all active:scale-95"
          >
            Close Splash
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  flex flex-col">
      <div className="p-10 flex items-center justify-center ">
        <Image
          src="/logo-icon.png"
          alt="Logo"
          width={150}
          height={80}
          priority
        />
      </div>
      <div className="flex-1">
        <OnboardingCarousel onComplete={handleComplete} />
      </div>
    </div>
  );
}
