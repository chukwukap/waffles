"use client";

import { MinikitProvider } from "./MinikitProvider";
import { SoundProvider } from "./SoundProvider";
import GlobalToaster from "../ui/Toaster";
import { AuthGate } from "../onboarding/auth-gate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MinikitProvider>
      <AuthGate>
        <SoundProvider>
          {children}
          <GlobalToaster />
        </SoundProvider>
      </AuthGate>
    </MinikitProvider>
  );
}
