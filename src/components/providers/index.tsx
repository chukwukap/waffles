"use client";

import { MinikitProvider } from "./MinikitProvider";
import GlobalToaster from "../ui/Toaster";
import { OnboardingGate } from "../onboarding/onboarding-gate";
import { SoundProvider } from "./SoundContext";


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MinikitProvider>
      <SoundProvider>
        <OnboardingGate>
          {children}

          <GlobalToaster />
        </OnboardingGate>
      </SoundProvider>
    </MinikitProvider>
  );
}
