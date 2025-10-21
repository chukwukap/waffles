"use client";

import { useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { PixelButton } from "@/components/buttons/PixelButton";
import LogoIcon from "@/components/logo/LogoIcon";
import { LeaveGameIcon } from "@/components/icons";
import GameScreen from "./_components/GameScreen";

/* Brand palettes for the 4 answer rows (match your mock) */
const PALETTES = [
  { bg: "#FFE8BA", border: "#FFC931", text: "#151515" }, // gold
  { bg: "#EFD6FF", border: "#B45CFF", text: "#151515" }, // purple
  { bg: "#D7EBFF", border: "#2E7DFF", text: "#151515" }, // blue
  { bg: "#D8FFF1", border: "#18DCA5", text: "#151515" }, // green
] as const;

export default function GamePage() {
  const { gameState, currentQuestion, tickQuestionTimer, resetGame } =
    useGameStore();

  // Tick every 1s while the question is active
  useEffect(() => {
    if (gameState !== "QUESTION_ACTIVE") return;
    const id = setInterval(() => tickQuestionTimer(), 1000);
    return () => clearInterval(id);
  }, [gameState, tickQuestionTimer]);

  if (!currentQuestion) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-figma px-6 text-center">
        <div className="space-y-4">
          <p className="text-lg text-white/90">No active question.</p>
          <PixelButton
            backgroundColor={PALETTES[0].bg}
            borderColor={PALETTES[0].border}
            textColor={PALETTES[0].text}
            onClick={resetGame}
          >
            Back to Lobby
          </PixelButton>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-figma">
      {/* ───────── Sticky Header ───────── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[color:var(--surface-popover)]/70 backdrop-blur">
        <div className="mx-auto grid w-full max-w-screen-sm grid-cols-[1fr_auto] items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <LogoIcon />
            <LiveBadge />
          </div>
          <div className="justify-self-end max-w-full">
            <button
              type="button"
              onClick={resetGame}
              aria-label="Leave game"
              className={`
                flex flex-row items-center justify-center gap-2 
                px-3 sm:px-4 py-1.5 
                min-w-[0] w-full max-w-[180px] sm:max-w-[160px] 
                h-8 sm:h-7 
                rounded-full 
                bg-white/[0.10] 
                hover:bg-white/[0.20] 
                active:bg-white/[0.16] 
                transition-colors 
                border-none 
                overflow-hidden
              `}
              style={{
                fontWeight: 400,
                fontSize: "clamp(13px, 4vw, 16px)",
                lineHeight: "1.1",
                color: "#FFF",
              }}
            >
              <span className="sr-only">Leave game</span>
              <span
                aria-hidden="true"
                className="flex flex-row items-center gap-2 min-w-0 truncate"
              >
                <span className="flex items-center flex-shrink-0">
                  <LeaveGameIcon width={18} height={18} />
                </span>
                <span
                  className={`
                    leading-snug flex items-center
                    min-w-0 truncate font-semibold
                    text-xs sm:text-sm md:text-base
                    uppercase tracking-wide
                  `}
                  style={{
                    height: "1.1em",
                  }}
                >
                  <span className="truncate block">LEAVE&nbsp;GAME</span>
                </span>
              </span>
            </button>
          </div>
        </div>
      </header>

      <GameScreen />
    </main>
  );
}

/* ——— Small helper badge ——— */
function LiveBadge() {
  return (
    <div className="flex flex-row items-center gap-[5px] w-[47px] h-[17px] p-0">
      <span className="w-[10px] h-[10px] rounded-full bg-[#FC1919] flex-none order-0" />
      <span
        className="flex-none order-1 text-center font-body"
        style={{
          fontStyle: "normal",
          fontWeight: 400,
          fontSize: "18px",
          lineHeight: "92%",
          letterSpacing: "-0.03em",
          color: "#FC1919",
        }}
      >
        LIVE
      </span>
    </div>
  );
}
