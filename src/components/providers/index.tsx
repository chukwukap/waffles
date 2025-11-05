"use client";

import { MinikitProvider } from "./MinikitProvider";
import GlobalToaster from "../ui/Toaster";
import { OnboardingGate } from "../onboarding/onboarding-gate";

import { UserPreferencesProvider } from "./userPreference";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MinikitProvider>
      <OnboardingGate>
        <UserPreferencesProvider>{children}</UserPreferencesProvider>
        <GlobalToaster />
      </OnboardingGate>
    </MinikitProvider>
  );
}
