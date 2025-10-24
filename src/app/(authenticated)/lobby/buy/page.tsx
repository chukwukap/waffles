"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useComposeCast, useSendToken } from "@coinbase/onchainkit/minikit";
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
import { Share } from "./_components/Share";

import { base } from "wagmi/chains";

type FriendSummary = {
  fid: number;
  username: string;
  displayName?: string | null;
  pfpUrl?: string | null;
  relationship: {
    isFollower: boolean;
    isFollowing: boolean;
  };
  hasTicket: boolean;
  ticketId?: number;
  ticketGameId?: number;
};

// ───────────────────────── CONSTANTS ─────────────────────────

export default function BuyWafflePage() {
  const { sendTokenAsync } = useSendToken();
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
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const { composeCastAsync } = useComposeCast();
  const gameId = game?.id ?? null;
  const farcasterId = user.fid ? String(user.fid) : null;

  useEffect(() => {
    setShowShare(Boolean(ticket));
  }, [ticket]);

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

    sendTokenAsync({
      amount: (game.config.ticketPrice * 10 ** 6).toString(),
      recipientAddress: env.waffleMainAddress,
    })
      .then(async () => {
        console.log("Ticket purchased successfully");
        await buyTicket(user.fid!, game.id);
        setShowShare(true);
      })

      .catch(async () => {
        console.error("Ticket purchase failed");
      });

    // try {
    //   setIsPurchasing(true);
    //   await buyTicket(user.fid, game.id);
    //   await Promise.all([fetchTicket(String(user.fid), game.id), fetchStats()]);
    // } catch (err) {
    //   console.error("Ticket purchase failed", err);
    // } finally {
    //   setIsPurchasing(false);
    // }
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

    try {
      const message = `Just secured my waffle ticket for ${game.name}!`;

      const result = await composeCastAsync({
        text: message,
        embeds: [env.rootUrl || ""],
      });

      // result.cast can be null if user cancels
      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
      } else {
        console.log("User cancelled the cast");
      }
    } catch (error) {
      console.error("Error sharing cast:", error);
      alert("Unable to share your ticket right now.");
    }
  }, [ticket, game, composeCastAsync]);

  useEffect(() => {
    if (!farcasterId || !gameId) return;
    fetchTicket(farcasterId, gameId).catch((error) =>
      console.error("Failed to fetch ticket info", error)
    );
  }, [farcasterId, gameId, fetchTicket]);

  useEffect(() => {
    if (!farcasterId || !gameId) {
      setFriends([]);
      setFriendsError(null);
      setFriendsLoading(false);
      return;
    }
    const controller = new AbortController();
    const loadFriends = async () => {
      try {
        setFriendsLoading(true);
        setFriendsError(null);
        const res = await fetch(
          `/api/social/friends?fid=${farcasterId}&gameId=${gameId}`,
          { cache: "no-store", signal: controller.signal }
        );
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        const data = await res.json();
        setFriends(data.friends ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Failed to load friends", err);
        setFriends([]);
        setFriendsError("Could not load your friends right now.");
      } finally {
        if (!controller.signal.aborted) {
          setFriendsLoading(false);
        }
      }
    };

    loadFriends();
    return () => controller.abort();
  }, [farcasterId, gameId, ticket?.id]);

  const prizePool = useMemo(() => {
    if (!stats) return null;
    return stats.totalPrize;
  }, [stats]);

  const spotsAvatars = useMemo(() => {
    const friendAvatars = friends
      .filter((friend) => friend.hasTicket && friend.pfpUrl)
      .map((friend) => friend.pfpUrl!)
      .slice(0, 4);
    if (friendAvatars.length > 0) return friendAvatars;
    const statsAvatars =
      stats?.players
        ?.map((player) => player.pfpUrl)
        .filter((url): url is string => Boolean(url)) ?? [];
    if (statsAvatars.length > 0) return statsAvatars.slice(0, 4);
    return [
      "/images/avatars/a.png",
      "/images/avatars/b.png",
      "/images/avatars/c.png",
      "/images/avatars/d.png",
    ];
  }, [friends, stats]);

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
          <span className="text-xs text-foreground">{`$${roundedBalance}`}</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col items-center gap-3 justify-center overflow-y-auto">
        {showShare && game ? (
          <Share
            gameTitle={game.name}
            theme={game.description || "See you Friday."}
            username={user.username || "Player"}
            avatarUrl={user.pfpUrl || "/images/avatars/a.png"}
            prizePool={prizePool}
            onShare={shareTicket}
            onBackHome={handleBackToHome}
          />
        ) : (
          <>
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
          </>
        )}

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
            avatars={spotsAvatars}
          />
        )}

        <FriendsList
          friends={friends}
          isLoading={friendsLoading}
          error={friendsError}
        />
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

function FriendsList({
  friends,
  isLoading,
  error,
}: {
  friends: FriendSummary[];
  isLoading: boolean;
  error: string | null;
}) {
  if (error) {
    return <div className="mt-6 text-sm text-red-400">{error}</div>;
  }

  if (isLoading) {
    return <div className="mt-6 text-sm text-muted">Loading your friends…</div>;
  }

  if (!friends.length) return null;

  return (
    <section className="mt-8 w-full max-w-[420px] px-4">
      <h2 className="text-sm font-display uppercase tracking-wide text-[#99A0AE]">
        Your friends
      </h2>
      <ul className="mt-3 space-y-3">
        {friends.slice(0, 8).map((friend) => (
          <li
            key={friend.fid}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-3 py-2 backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="relative size-10 overflow-hidden rounded-full border border-white/10">
                <Image
                  src={friend.pfpUrl || "/images/avatars/a.png"}
                  alt={friend.username}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-edit-undo text-white">
                  {friend.displayName || friend.username}
                </span>
                <span className="text-xs font-display text-[#99A0AE]">
                  @{friend.username}
                </span>
              </div>
            </div>
            <span
              className={cn(
                "text-xs font-edit-undo uppercase",
                friend.hasTicket ? "text-[#14B985]" : "text-[#FB72FF]"
              )}
            >
              {friend.hasTicket ? "Ticket secured" : "Needs ticket"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
