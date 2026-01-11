"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useAnimation } from "framer-motion";

import { WaffleButton } from "@/components/buttons/WaffleButton";
import { useGame } from "@/components/providers/GameProvider";
import { useUser } from "@/hooks/useUser";
import { useGameEntry } from "@/hooks/useGameEntry";
import { useTimer } from "@/hooks/useTimer";
import { springs } from "@/lib/animations";

import { BuyTicketModal } from "./BuyTicketModal";
import { PlayerAvatarStack } from "./PlayerAvatarStack";

// ==========================================
// COMPONENT
// ==========================================

export function NextGameCard() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get game from context (fetched at layout level)
  const { state: { game, prizePool: storePrizePool, playerCount: storePlayerCount } } = useGame();

  // Get user and entry data
  const { user } = useUser();
  const { entry, isLoading: isLoadingEntry, refetchEntry } = useGameEntry({
    gameId: game?.id,
    enabled: !!game,
  });

  // Realtime stats from context (updated via WebSocket), fallback to game prop
  const prizePool = storePrizePool ?? game?.prizePool ?? 0;
  const playerCount = storePlayerCount ?? game?.playerCount ?? 0;
  const spotsTotal = game?.maxPlayers ?? 500;

  // Derive phase
  const now = Date.now();
  const hasEnded = game ? now >= game.endsAt.getTime() : false;
  const isLive = game ? !hasEnded && now >= game.startsAt.getTime() : false;

  // Timer - countdown to start or end
  const targetMs = game ? (isLive ? game.endsAt.getTime() : game.startsAt.getTime()) : 0;
  const countdown = useTimer(targetMs);

  // Derived state
  const hasTicket = !!entry?.paidAt;

  // Animation controls
  const prevPrizePool = useRef(prizePool);
  const prevSpotsTaken = useRef(playerCount);
  const prizeControls = useAnimation();
  const spotsControls = useAnimation();

  useEffect(() => {
    if (prevPrizePool.current !== prizePool) {
      prizeControls.start({
        scale: [1, 1.2, 1],
        color: ["#FFFFFF", "#F5BB1B", "#FFFFFF"],
        transition: { duration: 0.4, ease: "easeOut" as const },
      });
      prevPrizePool.current = prizePool;
    }
  }, [prizePool, prizeControls]);

  useEffect(() => {
    if (prevSpotsTaken.current !== playerCount) {
      spotsControls.start({
        scale: [1, 1.15, 1],
        transition: { duration: 0.3, ease: "easeOut" as const },
      });
      prevSpotsTaken.current = playerCount;
    }
  }, [playerCount, spotsControls]);

  // Format countdown
  const pad = (n: number) => String(n).padStart(2, "0");
  const countdownDisplay = `${pad(Math.floor(countdown / 3600))}H ${pad(
    Math.floor((countdown % 3600) / 60)
  )}M ${pad(countdown % 60)}S`;

  // Button config - show loading while checking entry to prevent flash
  const buttonConfig = isLoadingEntry
    ? { text: "LOADING...", disabled: true, href: null }
    : hasEnded
      ? { text: "VIEW RESULTS", disabled: false, href: `/game/${game?.id}/result` }
      : isLive
        ? hasTicket
          ? { text: "PLAY NOW", disabled: false, href: `/game/${game?.id}/live` }
          : { text: "GET TICKET", disabled: false, href: null }
        : hasTicket
          ? { text: "YOU'RE IN!", disabled: true, href: null }
          : { text: "BUY WAFFLE", disabled: false, href: null };

  const handleButtonClick = () => {
    if (buttonConfig.disabled) return;
    if (buttonConfig.href) {
      router.push(buttonConfig.href);
    } else {
      setIsModalOpen(true);
    }
  };


  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springs.gentle}
        whileHover={{ scale: 1.01 }}
        className="relative w-full max-w-[361px] mx-auto rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "rgba(21, 21, 25, 0.5)",
          boxShadow: "0px 5px 5.2px 8px rgba(12, 12, 14, 0.5)",
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...springs.bouncy }}
          className="relative flex flex-col justify-center items-center shrink-0 z-10 w-full h-[52px]"
          style={{ background: "rgba(27, 27, 29, 0.8)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex flex-row justify-center items-center gap-3 h-[30px]">
            <motion.div animate={{ rotate: [0, -5, 5, -3, 3, 0] }} transition={{ delay: 0.5, duration: 0.5 }}>
              <Image src="/images/icons/game-controller.png" alt="controller" width={30} height={30} />
            </motion.div>
            <span className="font-body text-white uppercase text-[26px] leading-[92%] tracking-[-0.03em]">
              WAFFLES #{(game?.gameNumber ?? 0).toString().padStart(3, "0")}
            </span>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative flex flex-row items-start z-10 shrink-0 px-2.5 pt-3 gap-3"
        >
          <StatBlock
            icon="/images/illustrations/spots.svg"
            iconSize={{ w: 55.12, h: 40 }}
            label="Spots"
            value={`${playerCount}/${spotsTotal}`}
            animateControls={spotsControls}
          />
          <StatBlock
            icon="/images/illustrations/money-stack.svg"
            iconSize={{ w: 38.32, h: 40 }}
            label="Prize pool"
            value={`$${prizePool.toLocaleString()}`}
            animateControls={prizeControls}
          />
        </motion.div>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, ...springs.bouncy }}
          className="relative flex justify-center items-center px-4 py-2 z-10 shrink-0"
        >
          <WaffleButton disabled={buttonConfig.disabled} onClick={handleButtonClick}>
            {buttonConfig.text}
          </WaffleButton>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, ...springs.gentle }}
          className="flex flex-col justify-center items-center z-10 shrink-0 w-full pt-2 gap-1.5"
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 0px rgba(245, 187, 27, 0)",
                "0 0 15px rgba(245, 187, 27, 0.4)",
                "0 0 0px rgba(245, 187, 27, 0)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
            className="flex flex-row justify-center items-center px-5 py-2.5 min-w-[158px] h-[44px] border-2 border-[#F5BB1B] rounded-full"
          >
            <motion.span
              key={countdown}
              initial={{ scale: 1.1, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-body text-center text-[#F5BB1B] text-lg"
            >
              {countdownDisplay}
            </motion.span>
          </motion.div>
          <span className="font-display text-center text-white/50 text-xs">
            Until game starts
          </span>
        </motion.div>

        {/* Player Avatars Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-row justify-center items-center w-full px-4 pb-4 mt-4"
          style={{ gap: "6px", minHeight: "25px" }}
        >
          <PlayerAvatarStack
            actionText="joined the game"
            overrideCount={playerCount}
            formatText={(count) =>
              count > 0
                ? `${count} ${count === 1 ? "person has" : "people have"} joined the game`
                : "Be the first to join!"
            }
          />
        </motion.div>
      </motion.div>

      <BuyTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        gameId={game?.id ?? ""}
        onchainId={(game?.onchainId as `0x${string}`) ?? null}
        theme={game?.theme ?? ""}
        themeIcon={game?.coverUrl ?? undefined}
        tierPrices={game?.tierPrices ?? []}
        onPurchaseSuccess={() => {
          refetchEntry();

        }}
        username={user?.username ?? undefined}
        userAvatar={user?.pfpUrl ?? undefined}
      />
    </>
  );
}

// ==========================================
// STAT BLOCK
// ==========================================

function StatBlock({
  icon,
  iconSize,
  label,
  value,
  animateControls,
}: {
  icon: string;
  iconSize: { w: number; h: number };
  label: string;
  value: string;
  animateControls?: ReturnType<typeof useAnimation>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05, y: -3 }}
      className="flex flex-col justify-center items-center flex-1 h-[85px]"
    >
      <Image src={icon} alt={label} width={iconSize.w} height={iconSize.h} />
      <span className="font-display text-center text-[#99A0AE] text-base">{label}</span>
      <motion.span animate={animateControls} className="font-body text-white text-2xl">
        {value}
      </motion.span>
    </motion.div>
  );
}
