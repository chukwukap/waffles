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
  const t = useCountdown(duration, onComplete);

  const ratio = t / duration;

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
          <CountdownCircle ratio={ratio} secondsLeft={t} />
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
  ratio,
  secondsLeft,
}: {
  ratio: number; // 1.0 → 0.0 progress (percent remaining)
  secondsLeft: number; // integer seconds left
}) {
  const size = 240;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  // 'ratio' is percent remaining (1.0 -> 0).
  // This formula makes the dashOffset go from 0 (full circle)
  // to 'circumference' (empty circle) as ratio goes from 1 to 0.
  const dashOffset = circumference * (1 - ratio);
  // const angle = ratio * 360 - 90; // For the commented-out dot

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

      {/* Moving progress dot (commented out in original) */}
      {/* <div
        className="absolute left-1/2 top-1/2"
        style={{
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          transition: "transform 0.2s linear",
          width: size,
          height: size,
          pointerEvents: "none",
        }}
      >
        <span
          className="absolute block rounded-full"
          style={{
            width: stroke + 6,
            height: stroke + 6,
            background: BLUE,
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translateY(${-r}px)`,
            boxShadow: "0 0 0 2px rgba(30,139,255,0.35)",
          }}
        />
      </div> */}

      {/* Timer Text */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span
          className="font-bold leading-none text-white tabular-nums"
          style={{
            fontSize: "clamp(2.5rem, 10vw, 7rem)",
          }}
        >
          {String(secondsLeft).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
