"use client";

import { useMemo } from "react";
import Image from "next/image";
import { CardStack } from "@/components/CardStack";
import { useMutuals } from "@/hooks/useMutuals";

import { TicketPageGameInfo, TicketPageUserInfo } from "./page";
import { WaffleCard } from "./_components/WaffleCard";
import { SuccessCard } from "./_components/SuccessCard";

type TicketPageClientImplProps = {
  gameInfo: TicketPageGameInfo;
  userInfo: TicketPageUserInfo;
};

export default function TicketPageClientImpl({
  gameInfo,
  userInfo,
}: TicketPageClientImplProps) {
  const ticket = userInfo && userInfo.tickets.length > 0 ? userInfo.tickets[0] : null
  // Use hook for mutuals
  const mutualsData = useMutuals({
    context: "game",
    gameId: gameInfo.id
  });

  // Prize pool calculation
  const prizePool = useMemo(() => {
    const ticketPrice = gameInfo.entryFee;
    const additionPrizePool = gameInfo.prizePool;
    const pool =
      (gameInfo._count?.tickets ?? 0) * ticketPrice + (additionPrizePool ?? 0);
    return pool;
  }, [gameInfo]);



  if (ticket !== null) {
    return (
      <SuccessCard
        theme={gameInfo.theme}
        prizePool={prizePool}
        fid={userInfo.fid}
        gameId={gameInfo.id}
        ticket={ticket}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 space-y-1 w-full overflow-x-hidden">
      <div className="flex flex-row items-center justify-between w-full max-w-lg h-[50px] mt-4 mx-auto">
        <div className="flex flex-col justify-center items-start h-full">
          <p className="font-medium font-display text-[14px] leading-[130%] tracking-[-0.03em] text-center text-[#99A0AE]">
            Next game theme
          </p>
          <h1 className="font-body font-normal text-[32px] leading-[100%] tracking-normal text-white">
            {gameInfo.theme.toUpperCase()}
          </h1>
        </div>

        {gameInfo.coverUrl && (
          <Image
            src={gameInfo.coverUrl}
            alt={gameInfo.theme.toUpperCase()}
            width={40}
            height={40}
            className="object-contain"
          />
        )}
      </div>
      <Image
        src="/images/illustrations/waffles.svg"
        alt="Waffle"
        width={225}
        height={132}
        priority
        className="mx-auto mb-2"
      />
      <h2 className="font-body font-normal text-[44px] leading-[92%] tracking-[-0.03em] text-center mb-4">
        GET YOUR WAFFLE
      </h2>
      <div className="mx-auto mb-4">
        <WaffleCard
          spots={gameInfo._count?.tickets ?? 0}
          prizePool={prizePool}
          price={gameInfo.entryFee}
          maxPlayers={gameInfo.maxPlayers}
          fid={userInfo.fid}
          gameId={gameInfo.id}
        />
      </div>

      <div className="flex flex-col items-center mb-8">
        <CardStack
          size="clamp(32px,7vw,48px)"
          borderColor="#fff"
          imageUrls={
            mutualsData?.mutuals
              .map((m) => m.pfpUrl)
              .filter((url): url is string => url !== null) ?? undefined
          }
        />
        <p className="font-display text-[#99A0AE] text-sm mt-2">
          {mutualsData?.mutualCount === 0
            ? "and others have joined the game"
            : `and ${mutualsData?.mutualCount ?? 0} other${(mutualsData?.mutualCount ?? 0) === 1 ? "" : "s"
            } have joined the game`}
        </p>
      </div>
    </div>
  );
}
