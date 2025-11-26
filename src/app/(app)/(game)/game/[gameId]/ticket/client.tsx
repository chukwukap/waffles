"use client";

import { useMemo, useState, use, useEffect } from "react";
import Image from "next/image";
import { CardStack } from "@/components/CardStack";

import { TicketPageGameInfo, TicketPageUserInfo } from "./page";
import { WaffleCard } from "./_components/WaffleCard";
import { SuccessCard } from "./_components/SuccessCard";
import { Ticket } from "@/lib/db";

type TicketPageClientImplProps = {
  gameInfoPromise: Promise<TicketPageGameInfo | null>;
  userInfoPromise: Promise<TicketPageUserInfo | null>;
};

export default function TicketPageClientImpl({
  gameInfoPromise,
  userInfoPromise,
}: TicketPageClientImplProps) {
  const gameInfo = use(gameInfoPromise);
  const userInfo = use(userInfoPromise);

  const [ticket, setTicket] = useState<Ticket | null>(
    userInfo && userInfo.tickets.length > 0 ? userInfo.tickets[0] : null
  );
  const [mutualsData, setMutualsData] = useState<{
    mutuals: Array<{ fid: number; pfpUrl: string | null }>;
    mutualCount: number;
    totalCount: number;
  } | null>(null);

  // Check if user already has a ticket for this game
  useEffect(() => {
    if (!userInfo?.fid || !gameInfo?.id) {
      setTicket(null);
      return;
    }

    const fetchTicket = async () => {
      try {
        const response = await fetch(
          `/api/user/ticket?fid=${userInfo.fid}&gameId=${gameInfo.id}`
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

    fetchTicket();
  }, [userInfo?.fid, gameInfo?.id]);

  // Fetch mutuals data
  useEffect(() => {
    if (!userInfo?.fid || !gameInfo?.id) return;

    const fetchMutuals = async () => {
      try {
        const res = await fetch(
          `/api/mutuals?fid=${userInfo.fid}&gameId=${gameInfo.id}&context=game`
        );
        if (res.ok) {
          const data = await res.json();
          setMutualsData(data);
        }
      } catch (err) {
        console.error("Error fetching mutuals:", err);
      }
    };

    fetchMutuals();
  }, [userInfo?.fid, gameInfo?.id]);

  // --- Derived State ---
  const prizePool = useMemo(() => {
    const ticketPrice = gameInfo?.entryFee ?? 50; // CHANGED
    const additionPrizePool = gameInfo?.prizePool; // CHANGED
    const pool =
      (gameInfo?._count?.tickets ?? 0) * ticketPrice + (additionPrizePool ?? 0);
    return pool;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameInfo, ticket]);

  const theme = useMemo(() => {
    return gameInfo?.theme ? gameInfo.theme : "CRYPTO"; // CHANGED (and set default)
  }, [gameInfo?.theme]);

  if (ticket !== null) {
    return (
      <SuccessCard
        theme={theme}
        prizePool={prizePool}
        fid={userInfo?.fid ?? 0}
        gameId={gameInfo?.id ?? 0}
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
            {theme.toUpperCase()}
          </h1>
        </div>
        <Image
          src={`/images/themes/${theme}.svg`}
          alt={theme.toUpperCase()}
          width={40}
          height={40}
          className="object-contain"
        />
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
          spots={gameInfo?._count?.tickets ?? 0}
          prizePool={prizePool}
          price={gameInfo?.entryFee ?? 0} // CHANGED
          maxPlayers={gameInfo?.maxPlayers ?? 0} // CHANGED
          fid={userInfo?.fid ?? 0}
          gameId={gameInfo?.id ?? 0}
          setTicket={setTicket}
        />
      </div>

      <div className="flex flex-col items-center mb-8">
        <CardStack
          size="clamp(32px,7vw,48px)"
          borderColor="#fff"
          imageUrls={
            mutualsData?.mutuals
              .map((m) => m.pfpUrl) // CHANGED: imageUrl -> pfpUrl
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
