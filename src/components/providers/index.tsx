"use client";

import { MinikitProvider } from "./MinikitProvider";
import GlobalToaster from "../ui/Toaster";
import { OnboardingGate } from "../onboarding/onboarding-gate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MinikitProvider>
      <OnboardingGate>
        {children}
        <GlobalToaster />
      </OnboardingGate>
    </MinikitProvider>
  );
}
