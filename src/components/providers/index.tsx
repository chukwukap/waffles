"use client";

import { MinikitProvider } from "./MinikitProvider";
import GlobalToaster from "../ui/Toaster";
import { OnboardingGate } from "../onboarding/onboarding-gate";

import { SWRConfig } from "swr";
import { UserPreferencesProvider } from "./userPreference";

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((res) => {
    if (!res.ok) {
      throw new Error(`Fetch error: ${res.statusText || res.status}`);
    }
    return res.json();
  });

function CoreAppLogic({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MinikitProvider>
      <SWRConfig value={{ fetcher }}>
        <OnboardingGate>
          <CoreAppLogic>
            <UserPreferencesProvider>{children}</UserPreferencesProvider>
            <GlobalToaster />
          </CoreAppLogic>
        </OnboardingGate>
      </SWRConfig>
    </MinikitProvider>
  );
}
