import { MinikitProvider } from "./MinikitProvider";
import { GameProvider } from "./GameProvider";
import GlobalToaster from "../ui/Toaster";
import { OnboardingGate } from "../onboarding/onboarding-gate";
import DeviceGate from "../DeviceGate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DeviceGate continueAnyway={process.env.NODE_ENV == "production"}>
      <MinikitProvider>
        <OnboardingGate>
          <GameProvider>
            {children}
            <GlobalToaster />
          </GameProvider>
        </OnboardingGate>
      </MinikitProvider>
    </DeviceGate>
  );
}
