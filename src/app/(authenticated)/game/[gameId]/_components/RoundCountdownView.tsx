"use client";

import ChatDrawer from "./ChatDrawer";
import { UseTimerResult } from "@/hooks/useTimer";

const BLUE = "#1E8BFF";

export default function RoundCountdownStage({
  roundTimer,
  gameId,
}: {
  roundTimer: UseTimerResult;
  gameId: number;
}) {
  const ratio = roundTimer.percent; // 0 → 1 progress
  const secondsLeft = Math.ceil(roundTimer.remaining / 1000);
  const totalSeconds = Math.ceil(roundTimer.duration / 1000);

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
          <CountdownCircle
            ratio={ratio}
            total={totalSeconds}
            secondsLeft={secondsLeft}
          />
        </div>

        <p className="mt-10 text-center text-muted text-lg font-display">
          Get ready for the next round!
        </p>
      </section>

      {/* Overlay things */}
      <section>
        {/* <ChatTickerOverlay /> */}
        <ChatDrawer gameId={gameId} />
      </section>
    </div>
  );
}

function CountdownCircle({
  total,
  ratio,
  secondsLeft,
}: {
  total: number;
  ratio: number; // 0 → 1
  secondsLeft: number; // integer seconds left
}) {
  const size = 240;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - ratio);
  const angle = ratio * 360 - 90;

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-label="Next round countdown"
      role="timer"
      aria-live="polite"
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

      {/* Moving progress dot */}
      <div
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
      </div>

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
