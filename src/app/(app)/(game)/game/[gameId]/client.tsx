"use client";

import { useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

import { calculatePrizePool, formatTime } from "@/lib/utils";
import { useCountdown } from "@/hooks/useCountdown";
import { usePartyGame } from "@/hooks/usePartyGame";
import { useGameData } from "@/hooks/useGameData";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";

import { GameActionButton } from "../_components/GameActionButton";
import { Chat } from "../_components/chat/Chat";
import LiveEventFeed from "../_components/LiveEventFeed";
import { GameStatusHeader } from "../_components/GameStatusHeader";
import { PrizePoolDisplay } from "../_components/PrizePoolDisplay";
import { PlayerCountDisplay } from "../_components/PlayerCountDisplay";

import type { GameDetails } from "./page";

interface Props {
  game: GameDetails;
}

export default function GameDetailsClient({ game }: Props) {
  const router = useRouter();
  const { context } = useMiniKit();
  const fid = context?.user?.fid;

  // User data
  const { ticket, mutuals, isLoading, isAuthorized } = useGameData(fid, game.id);

  // PartyKit for real-time features
  const { onlineCount, messages, events, sendChat } = usePartyGame({
    gameId: game.id.toString(),
    enabled: isAuthorized,
  });

  // Redirect unauthorized users
  useEffect(() => {
    if (!isLoading && !isAuthorized && fid) {
      router.replace("/invite");
    }
  }, [isLoading, isAuthorized, fid, router]);

  // Countdown logic
  const startMs = game.startsAt.getTime();
  const endMs = game.endsAt.getTime();

  const initialSeconds = useMemo(() => {
    const sec = (startMs - Date.now()) / 1000;
    return Math.max(0, sec);
  }, [startMs]);

  const hasFired = useRef(false);
  const countdown = useCountdown(initialSeconds, () => {
    if (!hasFired.current) hasFired.current = true;
  });

  // Derived state
  const now = Date.now();
  const hasStarted = now >= startMs && now < endMs;
  const hasEnded = now >= endMs;

  const prizePool = calculatePrizePool({
    ticketsNum: game._count.tickets,
    ticketPrice: game.entryFee,
    additionPrizePool: game.prizePool,
  });

  const formattedPrize = `$${prizePool.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  // Status helpers
  const getStatusText = () => {
    if (hasEnded) return "Game has ended";
    if (hasStarted) return "Game is LIVE";
    return "GAME STARTS IN";
  };

  const renderActionButton = () => {
    const pink = "var(--color-neon-pink)";

    if (hasEnded) {
      return <GameActionButton disabled>ENDED</GameActionButton>;
    }

    if (hasStarted) {
      return ticket ? (
        <GameActionButton
          href={`/game/${game.id}/live`}
          backgroundColor={pink}
          variant="wide"
          textColor="dark"
        >
          START
        </GameActionButton>
      ) : (
        <GameActionButton
          href={`/game/${game.id}/ticket`}
          backgroundColor={pink}
          variant="wide"
          textColor="dark"
        >
          GET TICKET
        </GameActionButton>
      );
    }

    return <GameActionButton>{formatTime(countdown.remaining)}</GameActionButton>;
  };

  // Loading state
  if (isLoading || (!isAuthorized && fid)) {
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

        <PrizePoolDisplay formattedPrizePool={formattedPrize} />

        <PlayerCountDisplay
          mutualsCount={mutuals?.totalCount ?? 0}
          playerCount={game._count.players}
          avatars={mutuals?.mutuals ?? []}
        />

        <LiveEventFeed maxEvents={5} gameId={game.id} initialEvents={events} />
      </section>

      <Chat
        gameId={game.id}
        activeCount={onlineCount}
        messages={messages}
        onSendMessage={sendChat}
      />

      <BottomNav />
    </>
  );
}

