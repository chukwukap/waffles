"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CardStack } from "@/components/CardStack";
import { useMutuals } from "@/hooks/useMutuals";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";
import sdk from "@farcaster/miniapp-sdk";

import { TicketPageGameInfo } from "./page";
import { TicketPurchaseCard } from "./_components/TicketPurchaseCard";

interface UserInfo {
  fid: number;
  username: string | null;
  pfpUrl: string | null;
}

interface TicketInfo {
  id: number;
  code: string;
  status: string;
  amountUSDC: number;
  gameId: number;
}

type TicketPageClientImplProps = {
  gameInfo: TicketPageGameInfo;
};

// Auth is handled by GameAuthGate in layout
export default function TicketPageClientImpl({
  gameInfo,
}: TicketPageClientImplProps) {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user and ticket data (auth verified by layout)
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user profile
        const userRes = await sdk.quickAuth.fetch("/api/v1/me");
        if (userRes.ok) {
          setUserInfo(await userRes.json());
        }

        // Fetch tickets for this game
        await fetchTicket();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [gameInfo.id]);

  // Separate function to fetch ticket (can be called after purchase)
  async function fetchTicket() {
    try {
      const ticketRes = await sdk.quickAuth.fetch(
        `/api/v1/me/tickets?gameId=${gameInfo.id}`
      );
      if (ticketRes.ok) {
        const tickets: TicketInfo[] = await ticketRes.json();
        setTicket(tickets[0] || null);
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
    }
  }

  // Use hook for mutuals
  const mutualsData = useMutuals({
    context: "game",
    gameId: gameInfo.id
  });

  // Prize pool calculation (now uses pre-computed prizePool field)
  const prizePool = useMemo(() => {
    // prizePool is pre-computed in the database
    return gameInfo.prizePool;
  }, [gameInfo]);

  if (isLoading) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <WaffleLoader text="LOADING..." />
        </div>
        <BottomNav />
      </>
    );
  }

  // Redirect to success page if user already has a ticket
  useEffect(() => {
    if (ticket !== null && userInfo) {
      const successParams = new URLSearchParams();
      successParams.set("username", userInfo.username || `Player #${userInfo.fid}`);
      if (userInfo.pfpUrl) {
        successParams.set("pfpUrl", userInfo.pfpUrl);
      }
      if (ticket.code) {
        successParams.set("ticketCode", ticket.code);
      }
      router.push(`/game/${gameInfo.id}/ticket/success?${successParams.toString()}`);
    }
  }, [ticket, userInfo, gameInfo.id, router]);

  // Show loading while checking ticket status or redirecting
  if (isLoading || (ticket !== null && userInfo)) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <WaffleLoader text="LOADING..." />
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <div className="h-dvh flex flex-col">
      <div className="flex-1 flex flex-col px-4 w-full min-h-0">
        {/* Theme Header */}
        <div
          className="flex flex-row items-center justify-between w-full max-w-lg mx-auto shrink-0"
          style={{ height: "clamp(40px, 7dvh, 50px)", marginTop: "clamp(8px, 2dvh, 16px)" }}
        >
          <div className="flex flex-col justify-center items-start h-full">
            <p className="font-medium font-display text-[14px] leading-[130%] tracking-[-0.03em] text-center text-[#99A0AE]">
              Next game theme
            </p>
            <h1 className="font-body font-normal text-[clamp(24px,5vw,32px)] leading-[100%] tracking-normal text-white">
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

        {/* Waffle Image */}
        <div
          className="mx-auto shrink-0"
          style={{ height: "clamp(80px, 16dvh, 132px)", marginBottom: "clamp(4px, 1dvh, 8px)" }}
        >
          <Image
            src="/images/illustrations/waffles.svg"
            alt="Waffle"
            width={225}
            height={132}
            priority
            className="h-full w-auto object-contain"
          />
        </div>

        {/* Title */}
        <h2
          className="font-body font-normal leading-[92%] tracking-[-0.03em] text-center shrink-0"
          style={{ fontSize: "clamp(44px, 7vw, 44px)", marginBottom: "clamp(8px, 2dvh, 16px)" }}
        >
          GET YOUR WAFFLE
        </h2>

        {/* Purchase Card */}
        <div className="mx-auto shrink-0" style={{ marginBottom: "clamp(8px, 2dvh, 16px)" }}>
          <TicketPurchaseCard
            spots={gameInfo.maxPlayers - gameInfo.playerCount}
            prizePool={prizePool}
            price={gameInfo.ticketPrice}
            maxPlayers={gameInfo.maxPlayers}
            gameId={gameInfo.id}
            onchainId={gameInfo.onchainId as `0x${string}` | null}
            onPurchaseSuccess={fetchTicket}
          />
        </div>

        {/* Mutuals Section */}
        <div className="flex flex-col items-center justify-center flex-1 min-h-0 pb-2">
          <CardStack
            size="clamp(40px,3vw,50px)"
            borderColor="#fff"
            imageUrls={
              mutualsData?.mutuals
                .map((m) => m.pfpUrl)
                .filter((url): url is string => url !== null) ?? undefined
            }
          />
          <p className="font-display text-[#99A0AE] text-xs mt-1">
            {mutualsData?.totalCount === 0
              ? "and others have joined the game"
              : `and ${mutualsData?.totalCount ?? 0} other${(mutualsData?.totalCount ?? 0) === 1 ? "" : "s"
              } have joined the game`}
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
