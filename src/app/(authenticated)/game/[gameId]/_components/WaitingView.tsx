"use client";

import { useMemo } from "react";
import { Clock } from "@/components/icons";
import { AvatarDiamond } from "./AvatarDiamond";
import ChatDrawer from "./ChatDrawer";
import ChatTickerOverlay from "./ChatTickerOverlay";

import { useTimer, UseTimerResult } from "@/hooks/useTimer";
import { calculatePrizePool, cn } from "@/lib/utils";
import { HydratedGame } from "@/state/types";

const FALLBACK_AVATARS_FOR_DIAMOND = Array.from({ length: 17 }).map((_, i) => ({
  id: `fb-${i}`,
  src: `/images/avatars/${String.fromCharCode(97 + (i % 4))}.png`,
  alt: `Waiting Player ${i + 1}`,
  opacity: i > 2 && i % 4 === 3 ? 0.2 : 1,
}));

/**
 * View displayed while waiting for the next game to start.
 * Shows a countdown, prize pool, player avatars, and chat.
 */
export default function WaitingView({
  game,
  onComplete,
}: {
  game: HydratedGame;
  onComplete: () => void;
}) {
  const waitingTimer = useTimer({
    duration: game?.startTime
      ? new Date(game.startTime).getTime() - Date.now()
      : 0,
    autoStart: true,
    onComplete,
  });
  const diamondAvatars = useMemo(() => {
    const players = [
      {
        username: "Player 1",
        pfpUrl: "/images/avatars/a.png",
      },
      {
        username: "Player 2",
        pfpUrl: "/images/avatars/b.png",
      },
      {
        username: "Player 3",
        pfpUrl: "/images/avatars/c.png",
      },
      {
        username: "Player 4",
        pfpUrl: "/images/avatars/d.png",
      },
      {
        username: "Player 5",
        pfpUrl: "/images/avatars/a.png",
      },
      {
        username: "Player 6",
        pfpUrl: "/images/avatars/b.png",
      },
      {
        username: "Player 7",
        pfpUrl: "/images/avatars/c.png",
      },
      {
        username: "Player 8",
        pfpUrl: "/images/avatars/d.png",
      },
      {
        username: "Player 9",
        pfpUrl: "/images/avatars/a.png",
      },
      {
        username: "Player 10",
        pfpUrl: "/images/avatars/b.png",
      },
      {
        username: "Player 11",
        pfpUrl: "/images/avatars/c.png",
      },
      {
        username: "Player 12",
        pfpUrl: "/images/avatars/d.png",
      },
      {
        username: "Player 13",
        pfpUrl: "/images/avatars/a.png",
      },
      {
        username: "Player 14",
        pfpUrl: "/images/avatars/b.png",
      },
      {
        username: "Player 15",
        pfpUrl: "/images/avatars/c.png",
      },
      {
        username: "Player 16",
        pfpUrl: "/images/avatars/d.png",
      },
      {
        username: "Player 17",
        pfpUrl: "/images/avatars/a.png",
      },
      {
        username: "Player 18",
        pfpUrl: "/images/avatars/b.png",
      },
      {
        username: "Player 19",
        pfpUrl: "/images/avatars/c.png",
      },
      {
        username: "Player 20",
        pfpUrl: "/images/avatars/d.png",
      },
      {
        username: "Player 21",
        pfpUrl: "/images/avatars/a.png",
      },
      {
        username: "Player 22",
        pfpUrl: "/images/avatars/b.png",
      },
      {
        username: "Player 23",
        pfpUrl: "/images/avatars/c.png",
      },
      {
        username: "Player 24",
        pfpUrl: "/images/avatars/d.png",
      },
      {
        username: "Player 25",
        pfpUrl: "/images/avatars/a.png",
      },
    ];
    if (players.length > 0) {
      // Map player data to the structure AvatarDiamond expects
      return players
        .slice(0, 17)
        .map((p: { username: string; pfpUrl: string }, i: number) => ({
          id: p.username || `player-${i}`, // Use username or index as ID
          src:
            p.pfpUrl ||
            `/images/avatars/${String.fromCharCode(97 + (i % 4))}.png`, // Use pfp or fallback
          alt: p.username || `Player ${i + 1}`,
          // Apply opacity pattern if desired, or keep all opaque
          opacity: i > 2 && i % 4 === 3 ? 0.2 : 1,
        }));
    }
    // Use predefined fallbacks if no players in stats
    return FALLBACK_AVATARS_FOR_DIAMOND;
  }, []);

  // Format prize pool, default to "$0.00"
  const formattedPrizePool = `$${calculatePrizePool(game).toLocaleString(
    "en-US",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )}`;
  const playerCount = game?._count.tickets ?? 0;

  return (
    <div
      className={cn(
        "w-full min-h-[92dvh] flex flex-col flex-1 text-foreground overflow-hidden items-center relative max-w-screen-sm mx-auto px-4",
        "bg-figma" // Apply background directly if not inheriting
      )}
    >
      <section className="flex-1 flex flex-col items-center gap-3 w-full pt-6 pb-4 overflow-visible">
        <div className="flex w-full h-10 min-h-[38px] items-center justify-center gap-0.5 p-2 sm:p-3">
          <div className="order-0 flex h-7 sm:h-[28px] min-w-0 flex-1 flex-col justify-center gap-3.5 font-body">
            <div className="order-0 flex h-7 sm:h-[28px] min-w-0 w-full flex-row items-center gap-2">
              <span
                className="h-7 w-7 flex-none sm:h-[28px] sm:w-[28px]"
                aria-label="Countdown"
              >
                <Clock />
              </span>
              <span
                className="truncate pl-1 select-none text-white font-normal leading-[0.92] tracking-tight"
                style={{
                  fontSize: "clamp(1rem,4vw,1.6rem)",
                  letterSpacing: "-0.03em",
                }}
              >
                GAME STARTS IN
              </span>
            </div>
          </div>
          <div className="order-1 box-border z-0 flex h-10 min-w-[64px] w-[clamp(72px,20vw,110px)] max-w-[140px] flex-none flex-row items-center justify-center rounded-full border-2 border-[var(--color-neon-pink)] bg-transparent px-4 py-1 sm:px-5 sm:py-2 tabular-nums">
            <span className="px-0 flex items-end justify-center w-full min-w-0 select-none not-italic text-center text-xs leading-[115%] text-[var(--color-neon-pink)]">
              {waitingTimer.formatted}
            </span>
          </div>
        </div>
        {/* Prize Pool Display */}
        <div className="flex w-full min-h-24 flex-col items-center justify-end gap-1 pb-2.5">
          <p className="w-auto min-w-[60px] sm:min-w-[80px] select-none text-center font-display font-medium leading-[1.3] tracking-tight text-muted text-[0.95rem] sm:text-base md:text-lg">
            Current prize pool
          </p>
          <div className="flex min-h-10 sm:min-h-[2.7rem] w-full items-center justify-center px-2 sm:px-4">
            <span className="block min-w-[70px] sm:min-w-[90px] select-none text-center font-body font-normal leading-[0.92] tracking-tight text-success text-[clamp(2rem,6vw,3rem)]">
              {formattedPrizePool}
            </span>
          </div>
        </div>
        <div className="w-full flex justify-center">
          <AvatarDiamond
            avatars={diamondAvatars}
            cellMin={32}
            cellMax={54}
            gap={2}
            className="scale-95 sm:scale-100"
          />
        </div>
        <p className="mt-1 min-w-[120px] text-center font-display font-medium tracking-[-0.03em] text-muted text-[clamp(13px,4vw,16px)] leading-[130%]">
          {playerCount} {playerCount === 1 ? "player has" : "players have"}{" "}
          joined
        </p>
      </section>
      <ChatTickerOverlay
        className="!absolute left-0 right-0 bottom-[70px] sm:bottom-[90px] z-10"
        maxItems={4}
      />
      <ChatDrawer />
    </div>
  );
}
