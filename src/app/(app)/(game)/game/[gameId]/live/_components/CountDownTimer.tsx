"use client";

import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown } from "@/lib/game-utils";
import CircularProgress from "./CircularProgress";

// ==========================================
// PROPS
// ==========================================

interface CountdownTimerProps {
  duration: number;
  onComplete: () => void;
  nextRoundNumber: number;
}

// ==========================================
// COMPONENT
// ==========================================

export function CountdownTimer({
  duration,
  onComplete,
  nextRoundNumber,
}: CountdownTimerProps) {
  const targetMs = Date.now() + duration * 1000;
  const { seconds, isComplete } = useCountdown(targetMs, { onComplete });

  // Calculate percentage remaining
  const percentage = (seconds / duration) * 100;

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-lg h-auto min-h-[388px]">
      <div
        className="font-body text-white text-center uppercase mb-15"
        style={{ fontSize: "18px", letterSpacing: "-0.03em", lineHeight: "92%" }}
      >
        PLEASE WAIT
      </div>

      <div
        className="font-body text-white text-center uppercase"
        style={{ fontSize: "36px", lineHeight: "92%", letterSpacing: "-0.03em" }}
      >
        ROUND {nextRoundNumber} IN
      </div>

      {/* Timer Circle */}
      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
        <CircularProgress
          size={138}
          strokeWidth={11}
          color="#1B8FF5"
          percentage={percentage}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-body text-[#1b8ff5]"
            style={{ fontSize: "78px", lineHeight: "115%", letterSpacing: "-0.02em" }}
          >
            {seconds}
          </span>
        </div>
      </div>

      <div
        className="font-display text-center text-[#99A0AE]"
        style={{ fontSize: "16px", lineHeight: "130%", letterSpacing: "-0.03em" }}
      >
        Get ready for the next round!
      </div>
    </div>
  );
}

export { CountdownTimer as default };
