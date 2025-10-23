"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoIcon from "@/components/logo/LogoIcon";
import { cn } from "@/lib/utils";
import { InviteIcon, WalletIcon } from "@/components/icons";
import { BottomNav } from "@/components/BottomNav";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { SpotsLeft } from "./_components/SpotsLeft";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useMiniUser } from "@/hooks/useMiniUser";
import { useGameStore } from "@/stores/gameStore";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { env } from "@/lib/env";
import { InviteFriendsDrawer } from "@/app/(authenticated)/profile/_components/InviteFriendsDrawer";

import { base } from "wagmi/chains";

// ───────────────────────── CONSTANTS ─────────────────────────

export default function BuyWafflePage() {
  const router = useRouter();
  const game = useGameStore((state) => state.game);
  const user = useMiniUser();
  const buyTicket = useLobbyStore((state) => state.buyTicket);
  const ticket = useLobbyStore((state) => state.ticket);
  const stats = useLobbyStore((state) => state.stats);
  const referralCode = useLobbyStore((s) => s.referralData?.code ?? "");
  const createReferral = useLobbyStore((s) => s.createReferral);
  const [isInviteOpen, setInviteOpen] = useState(false);
  const { roundedBalance } = useGetTokenBalance(user.wallet as `0x${string}`, {
    address: env.nextPublicUsdcAddress as `0x${string}`,
    chainId: base.id,
    decimals: 6,
    image: "/images/tokens/usdc.png",
    name: "USDC",
    symbol: "USDC",
  });

  // If already have a ticket, redirect to confirmation
  useEffect(() => {
    if (ticket) {
      router.replace("/game");
    }
  }, [ticket, router]);

  // ───────────────────────── HANDLER ─────────────────────────
  const handlePurchase = async () => {
    if (!user.fid) {
      console.error("User FID is not set");
      return;
    }
    if (!game) {
      console.error("Game is not set");
      return;
    }
    if (!game.config) {
      console.error("Game config is not set");
      return;
    }

    // sendTokenAsync({
    //   amount: (game.config.ticketPrice * 10 ** 6).toString(),
    //   recipientAddress: env.waffleMainAddress || "",
    // })
    //   .then(async () => {
    //     // await buyTicket(user.fid!, game.id, game.config!.ticketPrice);
    //     // if (purchaseStatus === "confirmed") {
    //     //   router.replace("/lobby/confirm");
    //     // }
    //   })
    //   .catch(async () => {
    //
    //   });

    await buyTicket(user.fid, game.id);
  };

  const handleOpenInvite = async () => {
    try {
      if (!referralCode && user.fid) {
        await createReferral(String(user.fid));
      }
    } catch (e) {
      console.error("Failed to create referral:", e);
    } finally {
      setInviteOpen(true);
    }
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
          <span className="text-xs text-foreground">{`$${roundedBalance}`}</span>
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
            disabled={ticket !== null}
          >
            {ticket !== null ? "PROCESSING..." : "BUY WAFFLE"}
          </FancyBorderButton>
        </div>

        {/* INVITE */}
        <button
          className="mt-5 flex items-center gap-1 text-xs font-bold text-[#00CFF2] hover:underline focus:outline-none"
          tabIndex={0}
          onClick={handleOpenInvite}
        >
          <InviteIcon />
          INVITE FRIENDS{" "}
          <span className="text-xs font-bold ml-1">(20% BOOST!)</span>
        </button>

        {game && (
          <SpotsLeft
            current={stats?.totalTickets || 0}
            total={game.config!.maxPlayers}
            avatars={(stats?.players ?? []).map(
              (p) => p.pfpUrl || "/images/avatars/a.png"
            )}
            subtitle={`${stats?.totalTickets} / ${game.config!.maxPlayers}`}
          />
        )}
      </div>

      <BottomNav />
      <InviteFriendsDrawer
        open={isInviteOpen}
        code={referralCode || "------"}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  );
}
