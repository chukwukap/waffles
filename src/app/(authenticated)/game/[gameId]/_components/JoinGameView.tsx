"use client";

import { useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, useMotionValue } from "framer-motion";
import { CardStack } from "@/components/CardStack";

import { useRouter } from "next/navigation";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { cn } from "@/lib/utils";
import { HydratedGame, HydratedUser } from "@/state/types";
import { joinGameAction } from "@/actions/game";

export default function JoinGameView({
  game,
  userInfo,
  friends,
}: {
  game: HydratedGame;
  userInfo: HydratedUser;
  friends: { fid: number; username: string; pfpUrl: string }[];
}) {
  const router = useRouter();

  const joinedCount = game?._count.tickets ?? 0;
  const avatars = useMemo(() => {
    return friends.slice(0, 4).map((friend) => ({
      src: friend.pfpUrl,
      alt: friend.username,
    }));
  }, [friends]);

  const bx = useMotionValue(0);
  const by = useMotionValue(0);
  const onBtnMove: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    bx.set(e.clientX - (rect.left + rect.width / 2));
    by.set(e.clientY - (rect.top + rect.height / 2));
  };
  const onBtnLeave = () => {
    bx.set(0);
    by.set(0);
  };

  const canJoin = Boolean(
    userInfo?.tickets.length && userInfo.tickets.length > 0
  );
  const handleJoin = useCallback(async () => {
    if (!canJoin) {
      router.replace("/lobby");
      return;
    }
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(10);
    }
    const result = await joinGameAction({ fid: userInfo.fid, gameId: game.id });
    if (result.success) {
      router.refresh();
    } else {
      console.error("Failed to join game:", result.error);
    }
  }, [canJoin, router, userInfo.fid, game.id]);

  const joinedLabel = joinedCount === 1 ? "person has" : "people have";

  const isDisabledByLoadingOrError = false;
  const buttonText = canJoin ? "JOIN GAME" : "GET TICKET";

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-black text-white">
      <Image
        src="/images/game-hero.gif"
        alt="Game background animation"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/95 pointer-events-none" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end px-6 pb-10 gap-6 pointer-events-none">
        <motion.div className="pointer-events-auto w-full max-w-sm">
          <FancyBorderButton
            aria-label={buttonText}
            onPointerMove={onBtnMove}
            onPointerLeave={onBtnLeave}
            disabled={isDisabledByLoadingOrError}
            onClick={handleJoin}
            className={cn(
              "w-full rounded-[18px] border-b-[6px] border-r-[6px] border-[#FFC931] bg-white px-6 py-4 text-center shadow-[0_6px_0_0_#FFC931] transition",
              isDisabledByLoadingOrError && "opacity-60 cursor-not-allowed"
            )}
          >
            <span className="block font-[Edit_Undo_BRK] text-2xl leading-none text-[#F5BB1B]">
              {buttonText}
            </span>
          </FancyBorderButton>
          {/* {statsError && !isLoadingStats && ( */}
          {/* <p className="text-center text-red-400 text-xs mt-2 pointer-events-auto">
              {" "}
              {statsError.message || "Could not load player count."}
            </p>
          )} */}
        </motion.div>

        <div className="flex items-center justify-center gap-3 pointer-events-auto">
          <CardStack
            images={avatars}
            size="clamp(32px, 7vw, 52px)"
            rotations={[-8.7, 5.85, -3.57, 7.56]}
            ariaLabel={`${joinedCount} players have joined`}
          />
          <span className="text-sm font-display text-[#DBE0F0]">
            {joinedCount} {joinedLabel} joined the game
          </span>
        </div>
      </div>
    </div>
  );
}
