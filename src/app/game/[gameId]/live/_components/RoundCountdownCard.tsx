"use client";

import { useCountdown } from "@/hooks/useCountdown";

const BLUE = "#1E8BFF";

export default function RoundCountdownCard({
  duration,
  onComplete,
}: {
  duration: number;
  onComplete: () => void;
}) {
  const { remaining, percentage } = useCountdown(duration, onComplete);

  return (
    <div className="animate-up">
      <section className="mx-auto w-full max-w-screen-sm px-4 pt-10 pb-8">
        <p className="mb-6 text-center text-white/85">PLEASE WAIT</p>
        <h1
          className="mb-8 text-center font-bold leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
          style={{
            fontSize: "clamp(1.15rem, 7vw, 2.5rem)",
            letterSpacing: "-0.03em",
          }}
        >
          NEXT&nbsp;ROUND&nbsp;IN
        </h1>

        <div className="grid place-items-center">
          <CountdownCircle percentage={percentage} secondsLeft={remaining} />
        </div>

        <p className="mt-10 text-center text-muted text-lg font-display">
          Get ready for the next round!
        </p>
      </section>

      {/* Overlays/extensions can live here; keep them inert wrt timers */}
      {/* <ChatDrawer gameId={gameId} fid={fid} /> */}
    </div>
  );
}

function CountdownCircle({
  percentage,
  secondsLeft,
}: {
  percentage: number; // 0 → 100 (percent complete), per useCountdown.ts
  secondsLeft: number; // integer seconds left
}) {
  const size = 240;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  // In useCountdown.ts, `percentage` is (progress as 0-100, 100 = fully elapsed).
  // For the circular progress, we want:
  // - Full circle visible when percentage = 0 (countdown starts)
  // - No circle visible when percentage = 100 (countdown ends)
  // strokeDashoffset: 0 = full circle visible, circumference = no circle visible
  // So: dashOffset = circumference * (percentage / 100)
  const dashOffset = circumference * (percentage / 100);

  const timeDisplay = Math.ceil(secondsLeft);

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-label="Next round countdown"
      aria-live="polite"
      aria-valuemin={0}
      aria-valuenow={secondsLeft}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
        />

        {/* Progress Ring */}
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={BLUE}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.2s linear" }}
          />
        </g>
      </svg>

      {/* Timer Text */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span
          className="font-bold leading-none text-white tabular-nums"
          style={{
            fontSize: "clamp(2.5rem, 10vw, 7rem)",
          }}
        >
          {String(timeDisplay).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
