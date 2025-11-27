"use client";

import { use, useRef, useState, useMemo, useEffect } from "react";
import { calculatePrizePool, formatTime } from "@/lib/utils";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";

import { useCountdown } from "@/hooks/useCountdown";

import { WaffleLoader } from "@/components/ui/WaffleLoader";

import { Game } from "./page";
import { useGameData } from "@/hooks/useGameData";

import { GameActionButton } from "./_components/GameActionButton";
import { Chat } from "./_components/chat/Chat";
import LiveEventFeed from "./_components/LiveEventFeed";
import { GameStatusHeader } from "./_components/GameStatusHeader";
import { PrizePoolDisplay } from "./_components/PrizePoolDisplay";
import { PlayerCountDisplay } from "./_components/PlayerCountDisplay";
import { BottomNav } from "@/components/BottomNav";

export default function GameHomePageClient({
  gamePromise,
}: {
  gamePromise: Promise<Game | null>;
}) {
  const game = use(gamePromise);
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const router = useRouter();

  // Data Fetching - Consolidated into one hook
  const {
    ticket,
    mutuals,
    isLoading: isUserLoading,
    isAuthorized
  } = useGameData(fid, game?.id);

  // State
  const [activeCount, setActiveCount] = useState(0);

  // Redirect if not active - using useEffect to avoid render side-effects
  useEffect(() => {
    if (!isUserLoading && !isAuthorized && fid) {
      router.replace("/invite");
    }
  }, [isUserLoading, isAuthorized, fid, router]);

  // Game Timing Logic
  const startTimeMs = game?.startsAt?.getTime() ?? 0;
  const endTimeMs = game?.endsAt?.getTime() ?? 0;

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

  // Derived State
  const now = Date.now();
  const gameExists = game !== null;
  const hasStarted = gameExists && now >= startTimeMs && now < endTimeMs;
  const hasEnded = gameExists && now >= endTimeMs;

  const formattedTime = formatTime(countdown.remaining);
  const formattedPrizePool = `$${calculatePrizePool({
    ticketsNum: game?._count.tickets ?? 0,
    ticketPrice: game?.entryFee ?? 0,
    additionPrizePool: game?.prizePool ?? 0,
  }).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    } `;

  const playerCount = game?._count.players ?? 0;
  const neonPinkColor = "var(--color-neon-pink)";

  // Render Helpers
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
            href={`/game/${game.id}/live?gameId=${game.id}&fid=${fid}`}
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
              ? `/game/${game.id}/ticket?fid=${fid}`
              : `/game/${game.id}/ticket`
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

  // Loading State
  if (isUserLoading || (!isAuthorized && fid)) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <WaffleLoader text="CHECKING ACCESS..." />
      </div>
    );
  }

  return (
    <>
      <section className="flex-1 overflow-y-auto space-y-1 px-3">
        <GameStatusHeader
          statusText={getStatusText()}
          actionButton={renderActionButton()}
        />

        <PrizePoolDisplay formattedPrizePool={formattedPrizePool} />

        <PlayerCountDisplay
          mutualsCount={mutuals?.mutualCount ?? 0}
          playerCount={playerCount}
          avatars={mutuals?.mutuals ?? []}
        />

        <LiveEventFeed
          maxEvents={5}
          gameId={game?.id ?? null}
        />

        <Chat
          gameId={game?.id ?? null}
          activeCount={activeCount}
          onStatsUpdate={(count: number) => setActiveCount(count)}
        />

      </section>
      <BottomNav />
    </>
  );
}
