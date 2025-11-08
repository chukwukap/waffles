// ───────────────────────── RoundCountdownView.tsx ─────────────────────────
"use client";

import { useCountdown } from "@/hooks/useCountdown";
import React from "react";
import SoundManager from "@/lib/SoundManager";
import { useUserPreferences } from "@/components/providers/userPreference";
import { Prisma } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

const BLUE = "#1E8BFF";

/**
 * New props interface for the component.
 * These values are now passed down from the parent (QuestionView).
 */
interface RoundCountdownViewProps {
  gameInfo: Prisma.GameGetPayload<{
    include: {
      config: {
        select: {
          roundTimeLimit: true;
        };
      };
    };
  }>;
}

export default function RoundCountdownView({
  gameInfo,
}: RoundCountdownViewProps) {
  const router = useRouter();
  const { context } = useMiniKit();
  const { prefs } = useUserPreferences();
  const roundTimeLimitMs = (gameInfo?.config?.roundTimeLimit ?? 15) * 1000;
  const msLeft = useCountdown(roundTimeLimitMs, () => {
    router.push(`/game/${gameInfo.id}/active?fid=${context?.user.fid}`);
  });
  // The 'percent' prop (1.0 -> 0.0) is the same as the old 'ratio'
  const secondsLeft = Math.ceil(msLeft / 1000);
  const ratio = secondsLeft / (gameInfo?.config?.roundTimeLimit ?? 15);
  const totalSeconds = gameInfo?.config?.roundTimeLimit ?? 15;

  React.useEffect(() => {
    if (prefs.soundEnabled) {
      SoundManager.play("roundBreak", { loop: true, volume: 0.4 });
    }
    return () => {
      SoundManager.stop("roundBreak");
    };
  }, [prefs.soundEnabled]);

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

      {/* Overlays/extensions can live here; keep them inert wrt timers */}
      {/* <ChatDrawer gameId={gameId} fid={fid} /> */}
    </div>
  );
}

function CountdownCircle({
  ratio,
  total,
  secondsLeft,
}: {
  total: number; // total seconds in this round break
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
      aria-valuemax={total}
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
