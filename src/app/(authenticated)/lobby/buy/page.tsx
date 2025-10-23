// ───────────────────────── src/app/lobby/buy/page.tsx ─────────────────────────
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LogoIcon from "@/components/logo/LogoIcon";
import { cn } from "@/lib/utils";
import { InviteIcon, WalletIcon } from "@/components/icons";
import { BottomNav } from "@/components/BottomNav";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { SpotsLeft } from "./_components/SpotsLeft";
import { useLobbyStore } from "@/stores/lobbyStore";

// ───────────────────────── CONSTANTS ─────────────────────────
const TICKET_PRICE = 50;
const GAME_ID = 1; // update if dynamic

export default function BuyWafflePage() {
  const router = useRouter();
  const { buyTicket, purchaseStatus } = useLobbyStore();
  const [isPurchasing, setIsPurchasing] = useState(false);

  // For visual placeholders (mocked stats)

  const playerCount = 250;

  // ───────────────────────── HANDLER ─────────────────────────
  const handlePurchase = async () => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    await buyTicket(1, GAME_ID, TICKET_PRICE); // userId=1 placeholder (replace with auth user later)
    setIsPurchasing(false);

    // If confirmed, move to confirm page
    if (purchaseStatus === "confirmed") {
      router.push("/lobby/confirm");
    }
  };

  // ───────────────────────── RENDER ─────────────────────────
  return (
    <div className="h-screen flex flex-col bg-figma noise relative font-body">
      {/* HEADER */}
      <div
        className={cn(
          "p-4 flex items-center justify-between border-b border-border bg-figma"
        )}
      >
        <LogoIcon />
        <div className="flex items-center gap-1.5 bg-figma rounded-full px-3 py-1.5">
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
          <FancyBorderButton onClick={handlePurchase} disabled={isPurchasing}>
            {isPurchasing || purchaseStatus === "pending"
              ? "PROCESSING..."
              : "BUY WAFFLE"}
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

        <SpotsLeft
          current={playerCount}
          total={300}
          avatars={[
            "/images/avatars/a.png",
            "/images/avatars/b.png",
            "/images/avatars/c.png",
            "/images/avatars/d.png",
          ]}
        />
      </div>

      <BottomNav />
    </div>
  );
}
