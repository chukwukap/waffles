// --- CountdownTimer Component ---
import { useCountdown } from "@/hooks/useCountdown";
import CircularProgress from "./CircularProgress";

export const CountdownTimer = ({
  duration,
  onComplete,
  nextRoundNumber,
}: {
  duration: number;
  onComplete: () => void;
  nextRoundNumber: number;
}) => {
  const { remaining, percentage: elapsedPercentage } = useCountdown(
    duration,
    () => {
      onComplete();
      // When timer completes, wait 1 second then reset
      // setTimeout(reset, 1000);
    }
  );

  // The hook gives us elapsed percentage, but the SVG needs remaining percentage
  const percentage = 100 - elapsedPercentage;

  // Display the ceiling of the remaining time (e.g., 15, 14, 13...)
  const timeLeft = Math.ceil(remaining);

  return (
    // Main container with exact dimensions and layout
    <div
      className="flex flex-col items-center justify-start w-full max-w-lg h-auto min-h-[388px]"
    >
      <div
        className="font-body text-white text-center uppercase mb-15"
        style={{
          fontSize: "18px",
          letterSpacing: "-0.03em",
          lineHeight: "92%",
        }}
      >
        PLEASE WAIT
      </div>

      <div
        className="font-body text-white text-center uppercase"
        style={{
          fontSize: "36px",
          lineHeight: "92%",
          letterSpacing: "-0.03em",
        }}
      >
        ROUND {nextRoundNumber} IN
      </div>

      {/* Timer Circle + Inner Text */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 220, height: 220 }}
      >
        {/* The SVG Circle */}
        <CircularProgress
          size={138}
          strokeWidth={11}
          color="#1B8FF5"
          percentage={percentage}
        />

        {/* The "15" text, centered absolutely */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* NOTE: Using 'font-body' as a fallback for 'Edit Undo BRK' */}
          <span
            className="font-body text-[#1b8ff5]"
            style={{
              fontSize: "78px",
              lineHeight: "115%",
              letterSpacing: "-0.02em",
            }}
          >
            {timeLeft}
          </span>
        </div>
      </div>

      <div
        className="font-display text-center text-[#99A0AE]"
        style={{
          fontSize: "16px",
          lineHeight: "130%",
          letterSpacing: "-0.03em",
        }}
      >
        Get ready for the next round!
      </div>
    </div>
  );
};
