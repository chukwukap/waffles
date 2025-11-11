"use client";

import { use, useRef, useState, useEffect } from "react";
import { Clock } from "@/components/icons";
import { calculatePrizePool, cn, formatMsToMMSS } from "@/lib/utils";
import { BottomNav } from "@/components/BottomNav";

import { useCountdown } from "@/hooks/useCountdown";
import { AvatarDiamond } from "./_components/AvatarDiamond";
import ChatTickerOverlay from "./_components/ChatTickerOverlay";
import { Chat } from "./_components/Chat";
import { GameActionButton } from "./_components/GameActionButton";
import { Prisma } from "@prisma/client";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

// User ticket information type matching API response
interface UserTicketInfo {
  hasTicket: boolean;
  ticketStatus: "pending" | "confirmed" | null;
  ticketId: number | null;
}

/**
 * View displayed while waiting for the next gameInfo to start.
 * Shows a countdown, prize pool, player avatars, and chat.
 */
export default function GameHomePageClient({
  upcomingOrActiveGamePromise,
}: {
  upcomingOrActiveGamePromise: Promise<Prisma.GameGetPayload<{
    include: {
      config: true;
      _count: { select: { tickets: true; participants: true } };
    };
  }> | null>;
}) {
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const upcomingOrActiveGame = use(upcomingOrActiveGamePromise);
  const [chatOpen, setChatOpen] = useState(false);
  const [userTicketInfo, setUserTicketInfo] = useState<UserTicketInfo | null>(
    null
  );

  // startTime and endTime are always Date (from Prisma)
  const startTimeMs = upcomingOrActiveGame?.startTime?.getTime() ?? 0;
  const endTimeMs = upcomingOrActiveGame?.endTime?.getTime() ?? 0;

  // When timer hits zero, refresh once (transition to gameInfo)
  const hasFiredRef = useRef(false);
  const msLeft = useCountdown(startTimeMs, () => {
    if (!hasFiredRef.current) {
      hasFiredRef.current = true;
      // router.refresh();
    }
  });
  const formattedTime = formatMsToMMSS(msLeft);

  const formattedPrizePool = `$${calculatePrizePool({
    ticketsNum: upcomingOrActiveGame?._count.tickets ?? 0,
    ticketPrice: upcomingOrActiveGame?.config?.ticketPrice ?? 0,
    additionPrizePool: upcomingOrActiveGame?.config?.additionPrizePool ?? 0,
  }).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const playerCount = upcomingOrActiveGame?._count.participants ?? 0;

  // Fetch user ticket information when fid and gameId are available
  useEffect(() => {
    if (!fid || !upcomingOrActiveGame?.id) {
      setUserTicketInfo(null);
      return;
    }

    const fetchTicketInfo = async () => {
      try {
        const response = await fetch(
          `/api/user/ticket?fid=${fid}&gameId=${upcomingOrActiveGame.id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch ticket information");
        }

        const data: UserTicketInfo = await response.json();
        setUserTicketInfo(data);
      } catch (error) {
        console.error("Error fetching ticket information:", error);
        // Set default "no ticket" state on error
        setUserTicketInfo({
          hasTicket: false,
          ticketStatus: null,
          ticketId: null,
        });
      }
    };

    fetchTicketInfo();
  }, [fid, upcomingOrActiveGame?.id]);

  // Determine if game has started or ended
  const now = Date.now();
  const gameExists = upcomingOrActiveGame !== null;
  const hasStarted = gameExists && now >= startTimeMs && now < endTimeMs;
  const hasEnded = gameExists && now >= endTimeMs;

  // Check if user has a confirmed ticket for this game
  const gottenTicket =
    userTicketInfo?.hasTicket === true &&
    userTicketInfo?.ticketStatus === "confirmed";

  // We'll use the same neon pink as .text-(--color-neon-pink)
  const neonPinkColor = "var(--color-neon-pink)";

  // Helper function to get the status text based on game state
  const getStatusText = () => {
    if (!gameExists) {
      return "No upcoming games. Please check back soon!";
    }
    if (hasEnded) {
      return "Game has ended";
    }
    if (hasStarted) {
      return "Game is LIVE";
    }
    return "GAME STARTS IN";
  };

  // Helper function to render the action button based on game state
  const renderActionButton = () => {
    if (!gameExists) {
      return <GameActionButton disabled>NONE</GameActionButton>;
    }

    if (hasEnded) {
      return <GameActionButton disabled>ENDED</GameActionButton>;
    }

    if (hasStarted) {
      if (gottenTicket) {
        return (
          <GameActionButton
            href={`/game/${upcomingOrActiveGame.id}/join?gameId=${upcomingOrActiveGame.id}`}
            backgroundColor={neonPinkColor}
            textColor="dark"
          >
            START
          </GameActionButton>
        );
      }

      // User doesn't have a ticket - show link to purchase page
      return (
        <GameActionButton
          href={fid ? `/lobby?fid=${fid}` : "/lobby"}
          variant="wide"
          backgroundColor={neonPinkColor}
          textColor="dark"
        >
          GET TICKET
        </GameActionButton>
      );
    }

    // Game hasn't started yet - show countdown
    return <GameActionButton>{formattedTime}</GameActionButton>;
  };

  return (
    <div
      className={cn(
        "w-full min-h-[92dvh] flex flex-col flex-1 text-foreground overflow-hidden items-center relative max-w-screen-sm mx-auto px-4"
      )}
    >
      <section className="flex-1 flex flex-col items-center gap-3 w-full pt-6 pb-4 overflow-visible">
        {/* Header */}
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
                {getStatusText()}
              </span>
            </div>
          </div>
          {/* Action Button */}
          {renderActionButton()}
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
