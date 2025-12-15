"use client";

import { MinikitProvider } from "./MinikitProvider";
import GlobalToaster from "../ui/Toaster";
import { AuthGate } from "../onboarding/auth-gate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MinikitProvider>
      <AuthGate>
        {children}
        <GlobalToaster />
      </AuthGate>
    </MinikitProvider>
  );
}
