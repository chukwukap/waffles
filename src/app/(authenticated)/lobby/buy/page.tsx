"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoIcon from "@/components/logo/LogoIcon";
import { cn } from "@/lib/utils";
import { InviteIcon, WalletIcon } from "@/components/icons";
import { BottomNav } from "@/components/BottomNav";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { SpotsLeft } from "./_components/SpotsLeft";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useConfigStore } from "@/stores/configStore";
import { useMiniUser } from "@/hooks/useMiniUser";
import { useSendToken } from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";
import { useGameStore } from "@/stores/gameStore";

// ───────────────────────── CONSTANTS ─────────────────────────

export default function BuyWafflePage() {
  const router = useRouter();
  const byGameId = useConfigStore((state) => state.byGameId);
  const { buyTicket, purchaseStatus, ticket, stats } = useLobbyStore();
  const gameId = useGameStore((state) => state.gameId);

  const user = useMiniUser();
  const { sendTokenAsync } = useSendToken();

  // If already have a ticket, redirect to confirmation
  useEffect(() => {
    if (ticket && purchaseStatus === "confirmed") {
      router.replace("/lobby/confirm");
    }
  }, [ticket, purchaseStatus, router]);

  // ───────────────────────── HANDLER ─────────────────────────
  const handlePurchase = async () => {
    if (!user.fid) {
      console.error("User FID is not set");
      return;
    }
    if (!gameId) {
      console.error("Game ID is not set");
      return;
    }
    const price = byGameId[gameId]?.ticketPrice;
    if (!price) {
      console.error("Ticket price is not set");
      return;
    }
    sendTokenAsync({
      amount: (price * 10 ** 6).toString(),
      recipientAddress: env.waffleMainAddress || "",
    }).then(async () => {
      await buyTicket(user.fid!, gameId, price);
      if (purchaseStatus === "confirmed") {
        router.replace("/lobby/confirm");
      }
    });
  };

  return (
    <div className="h-screen flex flex-col bg-figmaYay noise relative font-body">
      {/* HEADER */}
      <div
        className={cn(
          "p-4 flex items-center justify-between border-b border-border bg-figmaYay"
        )}
      >
        <LogoIcon />
        <div className="flex items-center gap-1.5 bg-figmaYay rounded-full px-3 py-1.5">
          <WalletIcon className="w-4 h-4 text-foreground" />
          <span className="text-xs text-foreground">{`$983.23`}</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col items-center gap-6 justify-center overflow-y-auto">
        <div className="mb-6">
          <Image
            src="/images/illustration/waffle-ticket.png"
            alt="Waffle Ticket"
            width={152}
            height={93}
            className="mx-auto"
            style={{ imageRendering: "pixelated" }}
            priority
          />
        </div>

        <h1 className="text-foreground text-3xl text-center leading-tight">
          <span className="block">GET YOUR</span>
          <span className="block">WAFFLE</span>
        </h1>

        {/* BUY BUTTON */}
        <div className="w-full max-w-[400px] px-4">
          <FancyBorderButton
            onClick={handlePurchase}
            disabled={purchaseStatus === "pending"}
          >
            {purchaseStatus === "pending" ? "PROCESSING..." : "BUY WAFFLE"}
          </FancyBorderButton>
        </div>

        {/* INVITE */}
        <button
          className="mt-5 flex items-center gap-1 text-xs font-bold text-[#00CFF2] hover:underline focus:outline-none"
          tabIndex={0}
        >
          <InviteIcon />
          INVITE FRIENDS{" "}
          <span className="text-xs font-bold ml-1">(20% BOOST!)</span>
        </button>

        {gameId && byGameId[gameId] && (
          <SpotsLeft
            current={stats?.totalTickets || 0}
            total={byGameId[gameId]!.maxPlayers}
            avatars={(stats?.players ?? []).map(
              (p) => p.pfpUrl || "/images/avatars/a.png"
            )}
            subtitle={`${stats?.totalTickets} / ${
              byGameId[gameId]!.maxPlayers
            }`}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
