"use client";

import { useGameStore } from "@/stores/gameStore";
import { PixelButton } from "@/components/buttons/PixelButton";
import { useMiniUser } from "@/hooks/useMiniUser";

export default function GameOverView() {
  const { score, resetGame, fetchQuestions, gameId } = useGameStore();
  const user = useMiniUser();
  return (
    <main className="flex flex-col items-center justify-center min-h-[100dvh] bg-figmaYay text-center space-y-6 px-6">
      {/* ───────────────────────── HEADER ───────────────────────── */}
      <h1 className="font-body text-3xl md:text-4xl text-white font-bold tracking-wide">
        GAME&nbsp;OVER
      </h1>

      {/* ───────────────────────── SCORE PANEL ───────────────────────── */}
      <div className="panel px-8 py-6 rounded-2xl bg-white/10 border border-white/20">
        <p className="text-white/80 text-lg font-body mb-2">Your total score</p>
        <p className="text-5xl font-display text-[color:var(--color-waffle-gold)]">
          {score}
        </p>
      </div>

      {/* ───────────────────────── ACTION BUTTONS ───────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <PixelButton
          backgroundColor="#FFE8BA"
          borderColor="#FFC931"
          textColor="#151515"
          onClick={() => {
            if (gameId && user.fid && user.username && user.pfpUrl) {
              fetchQuestions(gameId, {
                fid: user.fid,
                username: user.username,
                pfpUrl: user.pfpUrl,
              });
            } else {
              console.error("No user found");
            }
          }}
        >
          Play Again
        </PixelButton>

        <PixelButton
          backgroundColor="#EFD6FF"
          borderColor="#B45CFF"
          textColor="#151515"
          onClick={resetGame}
        >
          Back to Lobby
        </PixelButton>
      </div>
    </main>
  );
}
