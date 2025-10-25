"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useComposeCast, useSendToken } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { base } from "wagmi/chains";

import { BottomNav } from "@/components/BottomNav";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  GamePadIcon,
  InviteFriendsIcon,
  WalletIcon,
  WinsIcon,
  WinningsIcon,
} from "@/components/icons";
import LogoIcon from "@/components/logo/LogoIcon";
import { cn } from "@/lib/utils";
import { useMiniUser } from "@/hooks/useMiniUser";
import { env } from "@/lib/env";
import { InviteFriendsDrawer } from "@/app/(authenticated)/profile/_components/InviteFriendsDrawer";
import { useGame, useLobby } from "@/state";
import { Share } from "./_components/Share";

const FALLBACK_AVATARS = [
  "/images/avatars/a.png",
  "/images/avatars/b.png",
  "/images/avatars/c.png",
  "/images/avatars/d.png",
];

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

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value?: number | null) =>
  currencyFormatter.format(Number(value ?? 0));

export default function BuyWafflePage() {
  const { sendTokenAsync } = useSendToken();
  const { composeCastAsync } = useComposeCast();
  const router = useRouter();
  const { game } = useGame();
  const user = useMiniUser();
  const {
    ticket,
    stats,
    refreshStats,
    fetchTicket,
    purchaseTicket,
    createReferral,
    fetchReferralStatus,
    hasValidInvite,
    inviteStatusLoaded,
    myReferral,
  } = useLobby();

  const [isInviteOpen, setInviteOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const gameId = game?.id ?? null;
  const farcasterId = user.fid ? String(user.fid) : null;

  useEffect(() => {
    if (ticket && !showShare) {
      router.replace("/game");
    }
  }, [router, showShare, ticket]);

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
      refreshStats().catch((err) =>
        console.error("Failed to load lobby stats", err)
      );
    }
  }, [stats, refreshStats]);

  const handlePurchase = async () => {
    if (!user.fid || !game?.config) {
      console.error("Missing user or game context");
      return;
    }

    try {
      setIsPurchasing(true);
      setPurchaseError(null);

      const inviteOk = inviteStatusLoaded
        ? hasValidInvite
        : await fetchReferralStatus(String(user.fid));

      if (!inviteOk) {
        setPurchaseError("Redeem an invite code before buying a ticket.");
        router.push("/lobby/invite-code");
        return;
      }

      await sendTokenAsync({
        amount: (game.config.ticketPrice * 10 ** 6).toString(),
        recipientAddress: env.waffleMainAddress,
      });

      const createdTicket = await purchaseTicket(user.fid, game.id);
      if (createdTicket) {
        await fetchTicket(String(user.fid), game.id);
        await refreshStats();
      }

      setShowShare(true);
    } catch (error) {
      console.error("Ticket purchase failed", error);
      const inviteOk = inviteStatusLoaded ? hasValidInvite : false;
      if (!inviteOk) {
        setPurchaseError("Redeem an invite code before buying a ticket.");
      } else if (
        error instanceof Error &&
        error.message?.toLowerCase().includes("user rejected")
      ) {
        setPurchaseError("Transaction cancelled.");
      } else {
        setPurchaseError("Ticket purchase failed. Please try again.");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleOpenInvite = async () => {
    try {
      if (!myReferral?.code && user.fid) {
        await createReferral(String(user.fid));
      }
    } catch (error) {
      console.error("Failed to create referral", error);
    } finally {
      setInviteOpen(true);
    }
  };

  const handleBackHome = useCallback(() => {
    router.replace("/game");
  }, [router]);

  const handleExitToLobby = useCallback(() => {
    router.replace("/lobby");
  }, [router]);

  const shareTicket = useCallback(async () => {
    if (!ticket || !game) return;

    try {
      const message = `Just secured my waffle ticket for ${game.name}!`;
      const result = await composeCastAsync({
        text: message,
        embeds: [env.rootUrl || ""],
      });

      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
      } else {
        console.log("User cancelled the cast");
      }
    } catch (error) {
      console.error("Error sharing cast", error);
      alert("Unable to share your ticket right now.");
    }
  }, [composeCastAsync, game, ticket]);

  useEffect(() => {
    if (!farcasterId || !gameId) return;
    fetchTicket(farcasterId, gameId).catch((error) =>
      console.error("Failed to fetch ticket info", error)
    );
  }, [fetchTicket, farcasterId, gameId]);

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
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to load friends", error);
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

  const prizePool = useMemo(() => stats?.totalPrize ?? null, [stats]);

  const heroAvatars = useMemo(() => {
    const friendAvatars = friends
      .filter((friend) => friend.hasTicket && friend.pfpUrl)
      .map((friend) => friend.pfpUrl as string)
      .slice(0, 4);
    if (friendAvatars.length > 0) return friendAvatars;

    const statsAvatars =
      stats?.players
        ?.map((player) => player.pfpUrl)
        .filter((url): url is string => Boolean(url)) ?? [];
    if (statsAvatars.length > 0) return statsAvatars.slice(0, 4);

    return FALLBACK_AVATARS;
  }, [friends, stats]);

  const spotsTaken = stats?.totalTickets ?? 0;
  const spotsTotal = game?.config?.maxPlayers ?? 0;
  const percentFilled = spotsTotal
    ? Math.min(100, Math.round((spotsTaken / spotsTotal) * 100))
    : 0;
  const ticketPrice = game?.config?.ticketPrice ?? 0;
  const ticketPriceLabel = formatCurrency(ticketPrice);
  const prizeLabel =
    prizePool !== null ? formatCurrency(prizePool) : "Prize TBA";
  const themeLabel = game?.description || "Movies & Anime";
  const heroTitle = game?.name || "Friday Final";
  const heroSubtitle = `${themeLabel} · ${spotsTotal || 0} spots`;
  const othersCount = Math.max(spotsTaken - heroAvatars.length, 0);
  const friendsCopy = othersCount
    ? `and ${othersCount} others have joined the game`
    : "Be among the first to lock in a ticket";

  if (showShare && game) {
    return (
      <div className="relative min-h-[100dvh] bg-figma text-white">
        <Share
          gameTitle={game.name}
          theme={themeLabel}
          username={user.username || "Player"}
          avatarUrl={user.pfpUrl || "/images/avatars/a.png"}
          prizePool={prizePool}
          onShare={shareTicket}
          onBackHome={handleBackHome}
        />
        <BottomNav />
        <InviteFriendsDrawer
          open={isInviteOpen}
          code={myReferral?.code || "------"}
          onClose={() => setInviteOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-figma text-white">
      <div className="pointer-events-none absolute inset-0 bg-[url('/images/noise.png')] opacity-10" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#191919]/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LogoIcon />
            <div className="leading-tight">
              <p className="text-xs font-semibold uppercase tracking-[0.25em]">
                Waffles
              </p>
              <p className="text-[11px] text-white/60">by Waffles</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-display">
              <WalletIcon className="h-4 w-4 text-white" />
              <span>${roundedBalance ?? "0.00"}</span>
            </div>
            <button
              className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10"
              onClick={handleExitToLobby}
              aria-label="Back to lobby"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto px-4 pb-36 pt-6">
        <div className="mx-auto flex w-full max-w-[430px] flex-col gap-6">
          <HeroHighlight
            title={heroTitle}
            subtitle={heroSubtitle}
            prizeLabel={prizeLabel}
            spotsLabel={
              spotsTotal ? `${spotsTaken}/${spotsTotal}` : `${spotsTaken}`
            }
            percentFilled={percentFilled}
            theme={themeLabel}
            avatars={heroAvatars}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatBadge
              label="Ticket price"
              value={ticketPriceLabel}
              icon={<WalletIcon className="h-6 w-6 text-[#14B985]" />}
              accent="teal"
            />
            <StatBadge
              label="Prize pool"
              value={prizeLabel}
              icon={<WinningsIcon className="h-6 w-6 text-[#FFC931]" />}
              accent="gold"
            />
            <StatBadge
              label="Theme"
              value={themeLabel.toUpperCase()}
              icon={<GamePadIcon className="h-6 w-6 text-[#FB72FF]" />}
              accent="pink"
            />
            <StatBadge
              label="Spots filled"
              value={`${percentFilled}%`}
              subtext={spotsTotal ? `${spotsTaken}/${spotsTotal} players` : ""}
              icon={<WinsIcon className="h-6 w-6 text-[#00CFF2]" />}
            />
          </div>

          <TicketActionCard
            ticketPriceLabel={ticketPriceLabel}
            onPurchase={handlePurchase}
            disabled={isPurchasing}
            isPurchasing={isPurchasing}
            errorMessage={purchaseError}
          />

          <InvitePanel
            inviteCode={myReferral?.code}
            onInvite={handleOpenInvite}
          />

          <FriendsStrip avatars={heroAvatars} description={friendsCopy} />

          <FriendsList
            friends={friends}
            isLoading={friendsLoading}
            error={friendsError}
          />
        </div>
      </main>

      <BottomNav />

      <InviteFriendsDrawer
        open={isInviteOpen}
        code={myReferral?.code || "------"}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  );
}

type StatBadgeProps = {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  accent?: "gold" | "teal" | "pink" | "default";
};

function StatBadge({
  label,
  value,
  subtext,
  icon,
  accent = "default",
}: StatBadgeProps) {
  const accentClasses = {
    gold: "border-[#FFC931]/40",
    teal: "border-[#14B985]/40",
    pink: "border-[#FB72FF]/40",
    default: "border-white/10",
  } as const;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[18px] border bg-black/25 px-4 py-3 backdrop-blur",
        accentClasses[accent]
      )}
    >
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white/5">
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs font-display uppercase tracking-[0.2em] text-[#99A0AE]">
          {label}
        </p>
        <p className="font-edit-undo text-xl text-white">{value}</p>
        {subtext ? <p className="text-xs text-white/60">{subtext}</p> : null}
      </div>
    </div>
  );
}

type HeroHighlightProps = {
  title: string;
  subtitle: string;
  prizeLabel: string;
  spotsLabel: string;
  percentFilled: number;
  theme: string;
  avatars: string[];
};

function HeroHighlight({
  title,
  subtitle,
  prizeLabel,
  spotsLabel,
  percentFilled,
  theme,
  avatars,
}: HeroHighlightProps) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#1E1E1E] to-[#050505] px-5 py-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      <div className="relative z-10 flex flex-col gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#99A0AE]">
            Next drop
          </p>
          <h1 className="mt-2 font-edit-undo text-4xl leading-[0.92] text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-white/70">{subtitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-display uppercase tracking-[0.2em] text-[#99A0AE]">
              Prize pool
            </p>
            <p className="font-edit-undo text-2xl text-[#FFC931]">
              {prizeLabel}
            </p>
          </div>
          <div>
            <p className="text-xs font-display uppercase tracking-[0.2em] text-[#99A0AE]">
              Theme
            </p>
            <p className="font-edit-undo text-2xl text-white">{theme}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[16px] border border-white/10 bg-white/5 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              Spots
            </p>
            <p className="font-edit-undo text-2xl text-white">{spotsLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              Filled
            </p>
            <p className="font-edit-undo text-2xl text-[#00CFF2]">
              {percentFilled}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {avatars.map((src, index) => (
            <span
              key={`${src}-${index}`}
              className="inline-flex size-12 items-center justify-center rounded-xl border border-white/15 bg-[#0E0E11] shadow-[0_12px_25px_rgba(0,0,0,0.4)]"
            >
              <Image
                src={src}
                alt="Player avatar"
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl object-cover"
              />
            </span>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute -right-6 bottom-0 h-48 w-48 opacity-80 relative">
        <Image
          src="/images/illustration/waffle-ticket.png"
          alt="Waffle ticket"
          fill
          sizes="200px"
          className="object-contain"
        />
      </div>
    </section>
  );
}

type TicketActionCardProps = {
  ticketPriceLabel: string;
  onPurchase: () => void;
  disabled: boolean;
  isPurchasing: boolean;
  errorMessage: string | null;
};

function TicketActionCard({
  ticketPriceLabel,
  onPurchase,
  disabled,
  isPurchasing,
  errorMessage,
}: TicketActionCardProps) {
  return (
    <section className="rounded-[26px] border border-[#14B985] bg-white px-4 py-5 text-[#0F0F10] shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-display uppercase tracking-[0.4em] text-[#14B985]">
          Buy waffle
        </p>
        <p className="font-edit-undo text-[32px] leading-none text-[#0F0F10]">
          {ticketPriceLabel}
        </p>
        <p className="text-sm text-[#4B4B55]">
          Secures your seat and unlocks invite boosts for the next drop.
        </p>
      </div>
      <button
        onClick={onPurchase}
        disabled={disabled}
        className={cn(
          "mt-4 flex w-full items-center justify-center gap-3 rounded-[14px] bg-[#00CFF2] px-6 py-3 font-edit-undo text-2xl text-[#0F0F10] transition",
          disabled ? "opacity-60" : "active:translate-y-[2px]"
        )}
      >
        {isPurchasing ? "PROCESSING…" : `BUY WAFFLE ${ticketPriceLabel}`}
        <ArrowRightIcon className="h-5 w-5" />
      </button>
      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </section>
  );
}

type InvitePanelProps = {
  inviteCode?: string;
  onInvite: () => void;
};

function InvitePanel({ inviteCode, onInvite }: InvitePanelProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-black/25 px-5 py-4 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Invite friends (+20% boost)
          </p>
          <p className="font-edit-undo text-2xl text-white">
            {inviteCode ? `Code: ${inviteCode}` : "Reserve your squad"}
          </p>
        </div>
        <button
          onClick={onInvite}
          className="flex items-center justify-center gap-2 rounded-[14px] border border-[#00CFF2] px-5 py-3 font-edit-undo text-lg text-[#00CFF2] transition hover:bg-[#00CFF2]/10"
        >
          <InviteFriendsIcon className="h-5 w-5" />
          INVITE
        </button>
      </div>
    </section>
  );
}

type FriendsStripProps = {
  avatars: string[];
  description: string;
};

function FriendsStrip({ avatars, description }: FriendsStripProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex -space-x-4">
          {avatars.map((src, index) => (
            <Image
              key={`${src}-${index}`}
              src={src}
              alt="Friend avatar"
              width={56}
              height={56}
              className="size-14 rounded-2xl border-4 border-[#0F0F10] object-cover"
            />
          ))}
        </div>
        <p className="text-sm font-display text-[#99A0AE]">{description}</p>
      </div>
    </section>
  );
}

type FriendsListProps = {
  friends: FriendSummary[];
  isLoading: boolean;
  error: string | null;
};

function FriendsList({ friends, isLoading, error }: FriendsListProps) {
  if (error) {
    return (
      <section className="rounded-[24px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#99A0AE]">
        Loading your friends…
      </section>
    );
  }

  if (!friends.length) return null;

  return (
    <section className="rounded-[26px] border border-white/10 bg-black/30 px-5 py-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Friends playing
          </p>
          <p className="font-edit-undo text-2xl text-white">Stay ahead</p>
        </div>
        <span className="text-xs text-[#99A0AE]">{friends.length} active</span>
      </div>

      <ul className="mt-4 space-y-3">
        {friends.slice(0, 8).map((friend) => (
          <li
            key={friend.fid}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative size-11 overflow-hidden rounded-full border border-white/15">
                <Image
                  src={friend.pfpUrl || "/images/avatars/a.png"}
                  alt={friend.username}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-edit-undo text-lg text-white">
                  {friend.displayName || friend.username}
                </span>
                <span className="text-xs text-[#99A0AE]">
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
