"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
// import useLobbyStore from "@/stores/lobbyStore";
import LogoIcon from "@/components/logo/LogoIcon";
import { cn } from "@/lib/utils";
import { InviteIcon, WalletIcon } from "@/components/icons";
import { BottomNav } from "@/components/BottomNav";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { SpotsLeft } from "./_components/SpotsLeft";

const TICKET_PRICE = 50;

export default function BuyWafflePage() {
  const router = useRouter();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [prizePool] = useState(12500); // Mock data
  const [playerCount] = useState(250); // Mock data
  const [ticketNumber] = useState(251); // Mock data

  const handlePurchase = async () => {
    setIsPurchasing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setPurchased(true);
    setIsPurchasing(false);
  };

  if (purchased) {
    router.push("/lobby");
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-figma noise relative font-body">
      {/* Header */}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center gap-6 justify-center overflow-y-auto">
        {/* Ticket illustration */}
        <div className="mb-6">
          <Image
            src="/images/illustration/waffle-ticket.png"
            alt="Waffle Ticket"
            width={152}
            height={93}
            className="mx-auto"
            style={{
              imageRendering: "pixelated",
            }}
            priority
          />
        </div>

        <h1 className="text-foreground  text-3xl text-center leading-tight">
          <span className="block">GET YOUR</span>
          <span className="block">WAFFLE</span>
        </h1>

        {/* Buy Button */}
        <div className="w-full max-w-[400px] px-4">
          <FancyBorderButton onClick={handlePurchase} disabled={isPurchasing}>
            {isPurchasing ? "PROCESSING..." : "BUY WAFFLE"}
          </FancyBorderButton>
        </div>

        {/* Invite Friends */}
        <button
          className="mt-5 flex items-center gap-1 text-xs font-bold text-[#00CFF2] hover:underline focus:outline-none"
          tabIndex={0}
        >
          <InviteIcon />
          INVITE FRIENDS{" "}
          <span className="text-xs font-bold ml-1">(20% BOOST!)</span>
        </button>

        <SpotsLeft
          current={23}
          total={100}
          avatars={[
            "/images/avatars/a.png",
            "/images/avatars/b.png",
            "/images/avatars/c.png",
            "/images/avatars/d.png",
          ]}
        />
      </div>
      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
