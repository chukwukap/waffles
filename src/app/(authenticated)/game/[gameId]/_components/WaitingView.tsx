"use client";

// Added imports for state, effects, and routing
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Added
import { Clock } from "@/components/icons";
import { AvatarDiamond } from "./AvatarDiamond";
// import ChatDrawer from "./ChatDrawer";

// REMOVED: import { useTimer } from "@/hooks/useTimer";
import { calculatePrizePool, cn } from "@/lib/utils";
import { HydratedGame } from "@/state/types";

/**
 * Formats milliseconds into a MM:SS string.
 */
const formatMsToMMSS = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

/**
 * View displayed while waiting for the next game to start.
 * Shows a countdown, prize pool, player avatars, and chat.
 */
export default function WaitingView({
  game,
  startTime, // CHANGED: Prop is now startTime
}: {
  game: HydratedGame;
  startTime: string | Date; // CHANGED: Prop is now startTime
}) {
  const router = useRouter(); // Added router

  // --- START: Added Timer Logic ---
  const [now, setNow] = useState(Date.now());
  const startTimeMs = useMemo(() => new Date(startTime).getTime(), [startTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newNow = Date.now();
      setNow(newNow);

      if (newNow >= startTimeMs) {
        // Time's up!
        clearInterval(interval);
        router.refresh(); // Refresh the page to transition to the game
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [startTimeMs, router]);

  // Calculate remaining time and format it internally
  const remainingMs = Math.max(0, startTimeMs - now);
  const formattedTime = formatMsToMMSS(remainingMs); // This variable is now local
  // --- END: Added Timer Logic ---

  const diamondAvatars = useMemo(() => {
    // ... (This logic is unchanged, as requested)
    const players = [
      {
        username: "Player 1",
        pfpUrl: "/images/lobby/1.jpg",
      },
      // ... (rest of players array) ...
      {
        username: "Player 25",
        pfpUrl: "/images/lobby/25.jpg",
      },
    ];
    return players.map((player) => ({
      id: player.username,
      src: player.pfpUrl,
      alt: player.username,
    }));
  }, []);

  // Format prize pool, default to "$0.00"
  const formattedPrizePool = `$${calculatePrizePool(game).toLocaleString(
    "en-US",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )}`;
  const playerCount = game?._count.tickets ?? 0;

  // --- START: UI (Unchanged) ---
  // This entire return block is identical to your provided code.
  // It now uses the 'formattedTime' variable calculated above.
  return (
    <div
      className={cn(
        "w-full min-h-[92dvh] flex flex-col flex-1 text-foreground overflow-hidden items-center relative max-w-screen-sm mx-auto px-4"
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
          <div className="order-1 box-border z-0 flex h-10 min-w-[64px] w-[clamp(72px,20vw,110px)] max-w-[140px] flex-none flex-row items-center justify-center rounded-full border-2 border-[var(--color-neon-pink)] px-4 py-1 sm:px-5 sm:py-2 tabular-nums">
            <span className="px-0 flex items-end justify-center w-full min-w-0 select-none not-italic text-center text-xs leading-[115%] text-[var(--color-neon-pink)]">
              {formattedTime}
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
      {/* <ChatTickerOverlay
        className="!absolute left-0 right-0 bottom-[70px] sm:bottom-[90px] z-10"
        maxItems={4}
      /> */}
      {/* <ChatDrawer gameId={game.id} fid={userInfofid} /> */}
    </div>
  );
  // --- END: UI (Unchanged) ---
}
