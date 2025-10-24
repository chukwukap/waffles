"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { BuyConfirmation } from "./_components/BuyConfirmation";

import { base } from "wagmi/chains";

// ───────────────────────── CONSTANTS ─────────────────────────

export default function BuyWafflePage() {
  const router = useRouter();
  const game = useGameStore((state) => state.game);
  const user = useMiniUser();
  const buyTicket = useLobbyStore((state) => state.buyTicket);
  const ticket = useLobbyStore((state) => state.ticket);
  const stats = useLobbyStore((state) => state.stats);
  const fetchStats = useLobbyStore((state) => state.fetchStats);
  const referralCode = useLobbyStore((s) => s.referralData?.code ?? "");
  const createReferral = useLobbyStore((s) => s.createReferral);
  const fetchTicket = useLobbyStore((s) => s.fetchTicket);
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { roundedBalance } = useGetTokenBalance(user.wallet as `0x${string}`, {
    address: env.nextPublicUsdcAddress as `0x${string}`,
    chainId: base.id,
    decimals: 6,
    image: "/images/tokens/usdc.png",
    name: "USDC",
    symbol: "USDC",
  });

  useEffect(() => {
    if (!stats) {
      fetchStats().catch((err) =>
        console.error("Failed to load lobby stats", err)
      );
    }
  }, [stats, fetchStats]);

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

    try {
      setIsPurchasing(true);
      await buyTicket(user.fid, game.id);
      await Promise.all([
        fetchTicket(String(user.fid), game.id),
        fetchStats(),
      ]);
    } catch (err) {
      console.error("Ticket purchase failed", err);
    } finally {
      setIsPurchasing(false);
    }
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

  const handleBackToHome = useCallback(() => {
    router.replace("/game");
  }, [router]);

  const shareTicket = useCallback(async () => {
    if (!ticket || !game) return;
    const message = `Just secured my waffle ticket for ${game.name}!`;
    const shareData = {
      title: "Waffle Secured!",
      text: message,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          `${message} ${shareData.url ?? ""}`
        );
        alert("Link copied to clipboard!");
      } else {
        alert(message);
      }
    } catch (err) {
      console.error("Share ticket failed", err);
      alert("Unable to share your ticket right now.");
    }
  }, [ticket, game]);

  useEffect(() => {
    if (!stats) {
      fetchStats().catch((err) =>
        console.error("Failed to load lobby stats", err)
      );
    }
  }, [stats, fetchStats]);

  useEffect(() => {
    if (farcasterId && gameId) {
      fetchTicket(farcasterId, gameId).catch((error) =>
        console.error("Failed to fetch ticket info", error)
      );
    }
  }, [farcasterId, gameId, fetchTicket]);

  const prizePool = useMemo(() => {
    if (!stats) return null;
    return stats.totalPrize;
  }, [stats]);

  if (ticket && game) {
    return (
      <BuyConfirmation
        gameTitle={game.name}
        theme={game.description || "See you Friday."}
        username={user.username || "Player"}
        avatarUrl={user.pfpUrl || "/images/avatars/a.png"}
        prizePool={prizePool}
        onShare={shareTicket}
        onBackHome={handleBackToHome}
      />
    );
  }

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
      <div className="flex-1 flex flex-col items-center gap-3 justify-center overflow-y-auto">
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
            disabled={isPurchasing}
          >
            {isPurchasing ? "PROCESSING..." : "BUY WAFFLE"}
          </FancyBorderButton>
        </div>

        {/* INVITE */}
        <button
          className="flex items-center gap-1 text-xs font-bold text-[#00CFF2] hover:underline focus:outline-none"
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
            // avatars={(stats?.players ?? []).map(
            //   (p) => p.pfpUrl || "/images/avatars/a.png"
            // )}

            avatars={[
              "/images/avatars/a.png",
              "/images/avatars/b.png",
              "/images/avatars/c.png",
              "/images/avatars/d.png",
            ]}
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
