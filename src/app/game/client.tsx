"use client";

import { use, useRef, useState, useEffect, useMemo } from "react";
import { Clock } from "@/components/icons";
import { calculatePrizePool } from "@/lib/utils";

import { useCountdown } from "@/hooks/useCountdown";
import { AvatarDiamond } from "./_components/AvatarDiamond";
import LiveEventFeed from "./_components/LiveEventFeed";
import { Chat } from "./_components/chat/Chat";
import { GameActionButton } from "./_components/GameActionButton";
import { Prisma, Ticket } from "@prisma/client";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { ChatInput } from "@/app/game/_components/chat/ChatTrigger";

function formatTime(remainingSeconds: number): string {
  const seconds = Math.max(0, remainingSeconds);
  const minutes = Math.floor(seconds / 60);
  const secondsPart = Math.floor(seconds % 60);
  const paddedSeconds = String(secondsPart).padStart(2, "0");
  return `${minutes}M ${paddedSeconds}S`;
}

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
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const startTimeMs = upcomingOrActiveGame?.startTime?.getTime() ?? 0;
  const endTimeMs = upcomingOrActiveGame?.endTime?.getTime() ?? 0;

  const initialDurationSec = useMemo(() => {
    if (!startTimeMs) return 0;
    const duration = (startTimeMs - Date.now()) / 1000;
    return Math.max(0, duration);
  }, [startTimeMs]);

  const hasFiredRef = useRef(false);
  const countdown = useCountdown(initialDurationSec, () => {
    if (!hasFiredRef.current) {
      hasFiredRef.current = true;
    }
  });
  const formattedTime = formatTime(countdown.remaining);

  const formattedPrizePool = `$${calculatePrizePool({
    ticketsNum: upcomingOrActiveGame?._count.tickets ?? 0,
    ticketPrice: upcomingOrActiveGame?.config?.ticketPrice ?? 0,
    additionPrizePool: upcomingOrActiveGame?.config?.additionPrizePool ?? 0,
  }).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const playerCount = upcomingOrActiveGame?._count.participants ?? 0;

  useEffect(() => {
    if (!fid || !upcomingOrActiveGame?.id) {
      setTicket(null);
      return;
    }

    const fetchTicketInfo = async () => {
      try {
        const gameId = upcomingOrActiveGame.id;
        const response = await fetch(
          `/api/user/ticket?fid=${fid}&gameId=${gameId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch ticket information");
        }

        const data: Ticket = await response.json();
        setTicket(data);
      } catch (error) {
        console.error("Error fetching ticket information:", error);
        setTicket(null);
      }
    };

    fetchTicketInfo();
  }, [fid, upcomingOrActiveGame?.id]);

  const now = Date.now();
  const gameExists = upcomingOrActiveGame !== null;
  const hasStarted = gameExists && now >= startTimeMs && now < endTimeMs;
  const hasEnded = gameExists && now >= endTimeMs;

  const neonPinkColor = "var(--color-neon-pink)";

  const getStatusText = () => {
    if (!gameExists) return "No upcoming games. Please check back soon!";
    if (hasEnded) return "Game has ended";
    if (hasStarted) return "Game is LIVE";
    return "GAME STARTS IN";
  };

  const renderActionButton = () => {
    if (!gameExists) return null;
    if (hasEnded) return <GameActionButton disabled>ENDED</GameActionButton>;
    if (hasStarted) {
      if (ticket) {
        return (
          <GameActionButton
            href={`/game/${upcomingOrActiveGame.id}/live?gameId=${upcomingOrActiveGame.id}&fid=${fid}`}
            backgroundColor={neonPinkColor}
            variant="wide"
            textColor="dark"
          >
            START
          </GameActionButton>
        );
      }
      return (
        <GameActionButton
          href={
            fid
              ? `/game/${upcomingOrActiveGame.id}/ticket?fid=${fid}`
              : `/game/${upcomingOrActiveGame.id}/ticket`
          }
          variant="wide"
          backgroundColor={neonPinkColor}
          textColor="dark"
        >
          GET TICKET
        </GameActionButton>
      );
    }
    return <GameActionButton>{formattedTime}</GameActionButton>;
  };

  return (
    <>
      <section className="flex-1 overflow-y-auto  space-y-1 px-3">
        <div className="flex w-full h-10 min-h-[38px] items-center justify-center gap-0.5 p-2 sm:p-3 my-8">
          <div className="flex h-7 sm:h-[28px] min-w-0 flex-1 items-center gap-2 font-body">
            <Clock
              className="flex-none h-[28px] w-[28px]"
              aria-label="Countdown"
            />

            <span className="truncate pl-1 select-none text-white font-normal leading-[0.92] tracking-[-0.03em] text-[26px] font-body">
              {getStatusText()}
            </span>
          </div>
          {renderActionButton()}
        </div>
        <div className="flex flex-col items-center justify-center mb-2">
          <p className="font-display font-medium text-[16px] leading-[130%] tracking-[-0.03em] text-center text-(--text-soft-400,#99A0AE)">
            Current prize pool
          </p>
          <span className="block text-[64px] text-center font-normal not-italic leading-[0.92] tracking-[-0.03em] text-[#14B985] font-body">
            {formattedPrizePool}
          </span>
        </div>
        <div className="w-full flex flex-col items-center justify-center mb-4">
          <AvatarDiamond
            cellMin={32}
            cellMax={54}
            gap={2}
            className="scale-95 sm:scale-100"
          />
          <p className="mt-1 min-w-[120px] text-center font-display font-medium tracking-[-0.03em] text-muted text-[clamp(13px,4vw,16px)] leading-[130%]">
            {playerCount === 0
              ? "No players have joined yet"
              : `${playerCount.toLocaleString()} ${
                  playerCount === 1 ? "player has" : "players have"
                } joined`}
          </p>
        </div>
        <LiveEventFeed maxEvents={5} />
        <Chat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </section>
      <ChatInput onOpenChat={() => setChatOpen(true)} />
    </>
  );
}
