"use client";

import { useCountdown } from "@/hooks/useCountdown";
import { LiveEventFeed } from "../../../_components/LiveEventFeed";
import { GameChat } from "../../../_components/GameChat";
import { formatCountdown } from "@/lib/game-utils";

// ==========================================
// PROPS
// ==========================================

interface RoundCountdownCardProps {
  duration: number;
  onComplete: () => void;
  nextRoundNumber: number;
}

// ==========================================
// COMPONENT
// ==========================================

export default function RoundCountdownCard({
  duration,
  onComplete,
  nextRoundNumber,
}: RoundCountdownCardProps) {
  const targetMs = Date.now() + duration * 1000;
  const { seconds } = useCountdown(targetMs, { onComplete });

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Countdown Display */}
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-white/50 font-display text-sm uppercase tracking-wider mb-2">
            Round {nextRoundNumber} starts in
          </p>
          <div className="text-[72px] font-body text-white tabular-nums">
            {formatCountdown(seconds)}
          </div>
          <p className="text-white/30 font-display text-xs mt-4">
            Get ready for the next round!
          </p>
        </div>

        {/* Live Events */}
        <LiveEventFeed maxEvents={5} />
      </div>

      {/* Chat is available during round break */}
      <GameChat gameId={0} />
    </>
  );
}
