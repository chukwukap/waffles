"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "@/components/icons";
import { AvatarDiamond } from "./AvatarDiamond";
import { calculatePrizePool, cn, formatMsToMMSS } from "@/lib/utils";
import { NeccessaryGameInfo } from "../page";
import { BottomNav } from "@/components/BottomNav";
import ChatTickerOverlay from "./ChatTickerOverlay";
import { Chat } from "./Chat";
import { useCountdown } from "@/hooks/useCountdown";

/**
 * View displayed while waiting for the next gameInfo to start.
 * Shows a countdown, prize pool, player avatars, and chat.
 */
export default function WaitingView({
  gameInfo,
}: {
  gameInfo: NeccessaryGameInfo;
}) {
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);

  // Efficient/robust timer
  const startTimeMs = useMemo(() => {
    // Defensive against string/Date/invalid date
    const ts =
      typeof gameInfo.startTime === "string"
        ? new Date(gameInfo.startTime).getTime()
        : gameInfo.startTime instanceof Date
        ? gameInfo.startTime.getTime()
        : Number(gameInfo.startTime);
    return isNaN(ts) ? Date.now() : ts;
  }, [gameInfo.startTime]);

  // When timer hits zero, refresh once (transition to gameInfo)
  const hasFiredRef = useRef(false);
  const msLeft = useCountdown(startTimeMs, () => {
    if (!hasFiredRef.current) {
      hasFiredRef.current = true;
      router.refresh();
    }
  });
  const formattedTime = formatMsToMMSS(msLeft);

  // Full player avatars list
  const diamondAvatars = useMemo(() => {
    const players = [
      { username: "Player 1", pfpUrl: "/images/lobby/1.jpg" },
      { username: "Player 2", pfpUrl: "/images/lobby/2.jpg" },
      { username: "Player 3", pfpUrl: "/images/lobby/3.jpg" },
      { username: "Player 4", pfpUrl: "/images/lobby/4.jpg" },
      { username: "Player 5", pfpUrl: "/images/lobby/5.jpg" },
      { username: "Player 6", pfpUrl: "/images/lobby/6.jpg" },
      { username: "Player 7", pfpUrl: "/images/lobby/7.jpg" },
      { username: "Player 8", pfpUrl: "/images/lobby/8.jpg" },
      { username: "Player 9", pfpUrl: "/images/lobby/9.jpg" },
      { username: "Player 10", pfpUrl: "/images/lobby/10.jpg" },
      { username: "Player 11", pfpUrl: "/images/lobby/11.jpg" },
      { username: "Player 12", pfpUrl: "/images/lobby/12.jpg" },
      { username: "Player 13", pfpUrl: "/images/lobby/13.jpg" },
      { username: "Player 14", pfpUrl: "/images/lobby/14.jpg" },
      { username: "Player 15", pfpUrl: "/images/lobby/15.jpg" },
      { username: "Player 16", pfpUrl: "/images/lobby/16.jpg" },
      { username: "Player 17", pfpUrl: "/images/lobby/17.jpg" },
      { username: "Player 18", pfpUrl: "/images/lobby/18.jpg" },
      { username: "Player 19", pfpUrl: "/images/lobby/19.jpg" },
      { username: "Player 20", pfpUrl: "/images/lobby/20.jpg" },
      { username: "Player 21", pfpUrl: "/images/lobby/21.jpg" },
      { username: "Player 22", pfpUrl: "/images/lobby/22.jpg" },
      { username: "Player 23", pfpUrl: "/images/lobby/23.jpg" },
      { username: "Player 24", pfpUrl: "/images/lobby/24.jpg" },
      { username: "Player 25", pfpUrl: "/images/lobby/25.jpg" },
    ];
    return players.map((player) => ({
      id: player.username,
      src: player.pfpUrl,
      alt: player.username,
    }));
  }, []);

  const formattedPrizePool = `$${calculatePrizePool({
    ticketsNum: gameInfo?._count.tickets ?? 0,
    ticketPrice: gameInfo?.config?.ticketPrice ?? 0,
    additionPrizePool: gameInfo?.config?.additionPrizePool ?? 0,
  }).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const playerCount = gameInfo?._count.tickets ?? 0;

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
          <div className="order-1 box-border z-0 flex h-10 min-w-[64px] w-[clamp(72px,20vw,110px)] max-w-[140px] flex-none flex-row items-center justify-center rounded-full border-2 border-(--color-neon-pink) px-4 py-1 sm:px-5 sm:py-2 tabular-nums">
            <span className="px-0 flex items-end justify-center w-full min-w-0 select-none not-italic text-center text-xs leading-[115%] text-(--color-neon-pink)">
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
      <ChatTickerOverlay bottomOffset={150} />
      <ChatInput onOpenChat={() => setChatOpen(true)} bottomOffset={60} />
      <BottomNav />
      <Chat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

// --- Chat Input Component ---
const ChatInput = ({
  onOpenChat,
  bottomOffset,
}: {
  onOpenChat: () => void;
  bottomOffset: number;
}) => {
  return (
    <div
      className="absolute left-0 right-0 h-[78px] w-full px-4 pt-3 pb-5"
      style={{ bottom: `${bottomOffset}px` }}
    >
      <button
        onClick={onOpenChat}
        className="flex h-full w-full items-center rounded-full bg-white/5 px-4 py-[14px] text-white/40 transition-all duration-200 ease-in-out
                   hover:bg-white/10
                   active:bg-white/15
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        style={{
          fontSize: "14px",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: "130%",
        }}
      >
        Type...
      </button>
    </div>
  );
};
