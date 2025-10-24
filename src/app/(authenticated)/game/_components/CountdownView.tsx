"use client";

import { useGameStore } from "@/stores/gameStore";
import ChatTickerOverlay from "./ChatTickerOverlay";
import ChatDrawer from "./ChatDrawer";
import { useCountdown } from "@/hooks/useCountdown";

/** blue used in mocks */
const BLUE = "#1E8BFF";

export default function RoundCountdownStage() {
  const gameView = useGameStore((s) => s.gameView);
  const game = useGameStore((s) => s.game);
  const setGameView = useGameStore((s) => s.setGameView);
  const totalSeconds = game?.config?.roundTimeLimit ?? 0;
  const { millisecondsLeft, secondsLeft } = useCountdown({
    durationSeconds: totalSeconds,
    autoStart: gameView === "ROUND_COUNTDOWN",
    onComplete: () => {
      // Move into the next question after the round countdown fully elapses
      setGameView("QUESTION_ACTIVE");
    },
  });
  const ratio =
    totalSeconds > 0
      ? Math.max(0, Math.min(1, millisecondsLeft / (totalSeconds * 1000)))
      : 0;

  return (
    <div>
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

      <section>
        <ChatTickerOverlay />
        <ChatDrawer />
      </section>
    </div>
  );
}

/* ——————————— visual countdown ring ——————————— */
function CountdownCircle({
  total,
  ratio,
  secondsLeft,
}: {
  total: number;
  ratio: number;
  secondsLeft: number;
}) {
  // SVG geometry
  const size = 240; // px
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  // stroke animation (start at top)
  const dashOffset = c * (1 - ratio);
  const angle = 360 * ratio - 90; // -90 to start from top

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-label="Next round countdown"
      role="timer"
      aria-live="polite"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
      >
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
        />
        {/* progress */}
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={BLUE}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </g>
      </svg>

      {/* orbiting dot */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          transition: "transform 1s linear",
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
            transform: `translate(-50%, -50%) translateY(${-r + stroke / 2}px)`,
            boxShadow: "0 0 0 2px rgba(30,139,255,0.35)",
          }}
        />
      </div>

      {/* numeric value - remaining whole seconds */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span
          className="text-[12vw] sm:text-7xl md:text-8xl lg:text-9xl font-bold leading-none text-white"
          style={{
            fontSize: "clamp(2.5rem, 10vw, 7rem)",
          }}
        >
          {String(Math.max(0, Math.min(total, secondsLeft))).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
