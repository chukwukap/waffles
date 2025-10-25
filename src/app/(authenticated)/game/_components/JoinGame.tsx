"use client";

import { useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { CardStack } from "@/components/CardStack";
import { useGame, useLobby } from "@/state";
import { useMiniUser } from "@/hooks/useMiniUser";
import { useRouter } from "next/navigation";

const FALLBACK_AVATARS = [
  "/images/avatars/a.png",
  "/images/avatars/b.png",
  "/images/avatars/c.png",
  "/images/avatars/d.png",
];

export default function JoinGameScreen() {
  const router = useRouter();
  const user = useMiniUser();
  const { acknowledgeJoin } = useGame();
  const { stats, refreshStats, ticket } = useLobby();

  useEffect(() => {
    if (!stats) {
      refreshStats().catch((error) =>
        console.error("Failed to refresh lobby stats before join", error)
      );
    }
  }, [stats, refreshStats]);

  const joinedCount = stats?.totalTickets ?? 0;
  const players = stats?.players ?? [];

  const avatars = useMemo(() => {
    const source =
      players.length > 0
        ? players
        : FALLBACK_AVATARS.map((src, index) => ({
            username: `guest-${index + 1}`,
            wallet: "",
            pfpUrl: src,
          }));

    return source.slice(0, 4).map((player, index) => ({
      src: player.pfpUrl || FALLBACK_AVATARS[index % FALLBACK_AVATARS.length],
      alt: player.username || `Player ${index + 1}`,
    }));
  }, [players]);

  const bx = useMotionValue(0);
  const by = useMotionValue(0);
  const bRotateX = useTransform(by, [-40, 40], [6, -6]);
  const bRotateY = useTransform(bx, [-40, 40], [-6, 6]);

  const onBtnMove: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    bx.set(e.clientX - (rect.left + rect.width / 2));
    by.set(e.clientY - (rect.top + rect.height / 2));
  };

  const onBtnLeave = () => {
    bx.set(0);
    by.set(0);
  };

  const canJoin = Boolean(ticket);

  const handleJoin = useCallback(() => {
    if (!canJoin) {
      router.replace("/lobby/buy");
      return;
    }
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      // @ts-ignore
      navigator.vibrate?.(10);
    }
    acknowledgeJoin();
  }, [acknowledgeJoin, canJoin, router]);

  const joinedLabel = joinedCount === 1 ? "person has" : "people have";

  return (
    <div className="relative flex min-h-[100dvh] w-full items-end justify-center overflow-hidden bg-black text-white">
      <Image
        src="/images/game-hero.gif"
        alt="Game hero"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/95" />

      <div className="absolute inset-0 flex flex-col justify-between px-6 pt-8 pb-10">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/70">
          <span>Waffles</span>
          <span className="font-semibold">
            {user.username ? `@${user.username}` : "Welcome"}
          </span>
        </div>

        <div className="flex flex-col items-center justify-end gap-4">
          <motion.button
            aria-label="Join game"
            onPointerMove={onBtnMove}
            onPointerLeave={onBtnLeave}
            whileTap={{ scale: 0.98, y: 1 }}
            whileHover={{ y: -1 }}
            style={{
              rotateX: bRotateX,
              rotateY: bRotateY,
              transformStyle: "preserve-3d",
            }}
            disabled={!canJoin}
            onClick={handleJoin}
            className="w-full max-w-sm rounded-[18px] border-b-[6px] border-r-[6px] border-[#FFC931] bg-white px-6 py-4 text-center shadow-[0_6px_0_0_#FFC931] transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="block font-[Edit_Undo_BRK] text-2xl leading-none text-[#F5BB1B]">
              {canJoin ? "JOIN GAME" : "TICKET REQUIRED"}
            </span>
          </motion.button>

          <div className="flex items-center justify-center gap-3">
            <CardStack
              images={avatars}
              size={48}
              overlap={20}
              radius={8}
              borderColor="#FFFFFF"
              rotations={[-8.7, 5.85, -3.57, 7.56]}
              ariaLabel="People joined"
            />
            <span className="text-sm font-display text-[#DBE0F0]">
              {joinedCount} {joinedLabel} joined the game
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
