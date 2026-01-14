"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRealtime } from "@/components/providers/RealtimeProvider";

// Avatar rotation angles from design specs
const AVATAR_ROTATIONS = [-8.71, 5.85, -3.57, 7.56];

interface PlayerAvatarStackProps {
  /** Text to show, e.g., "joined the game" or "just answered" */
  actionText?: string;
  /** Maximum number of avatars to show */
  maxAvatars?: number;
  /** Optional initial players (from server) - will merge with real-time */
  initialPlayers?: { pfpUrl: string | null; username?: string }[];
  /** Show count from store or override */
  overrideCount?: number;
  /** Custom action text formatter - receives count */
  formatText?: (count: number) => string;
}

/**
 * PlayerAvatarStack - Reusable component for showing real-time player avatars
 *
 * Uses the game store to get real-time player data from WebSocket.
 * When actionText is "just answered", shows players who answered the current question.
 */
export function PlayerAvatarStack({
  actionText = "joined the game",
  maxAvatars = 4,
  initialPlayers = [],
  overrideCount,
  formatText,
}: PlayerAvatarStackProps) {
  // Get real-time data from context
  const { recentPlayers, questionAnswerers, onlineCount } = useRealtime().state;

  // Use questionAnswerers for "just answered", otherwise recentPlayers
  const isAnswerContext = actionText === "just answered";
  const sourcePlayers = isAnswerContext ? questionAnswerers : recentPlayers;

  // Merge initial players with real-time players (avoid duplicates)
  const allPlayers = [...initialPlayers];
  sourcePlayers.forEach((p) => {
    if (!allPlayers.some((ip) => ip.username === p.username)) {
      allPlayers.push({ pfpUrl: p.pfpUrl, username: p.username });
    }
  });

  // Take first N for avatar display (latest first for answerers)
  const avatars = allPlayers.slice(0, maxAvatars);

  // Calculate display count
  const displayCount =
    overrideCount ??
    (isAnswerContext
      ? questionAnswerers.length
      : onlineCount > 0
      ? onlineCount
      : allPlayers.length || 0);

  // Format text - special case for zero
  //   const text = formatText
  //     ? formatText(displayCount)
  //     : displayCount === 0
  //     ? "Be the first to join!"
  //     : `${displayCount} ${
  //         displayCount === 1 ? "person has" : "people have"
  //       } ${actionText}`;

  return (
    <div className="flex flex-row items-center justify-center gap-2 px-0">
      {/* Overlapping avatar stack */}
      {avatars.length > 0 && (
        <div
          className="flex flex-row items-center"
          style={{
            width: `${28 + (avatars.length - 1) * 14}px`,
            height: "32px",
          }}
        >
          {avatars.map((player, index) => (
            <motion.div
              key={player.username || index}
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                rotate: AVATAR_ROTATIONS[index] || 0,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
                delay: index * 0.08,
              }}
              whileHover={{
                scale: 1.15,
                zIndex: 10,
                transition: { duration: 0.2 },
              }}
              className="relative box-border w-[28px] h-[28px] rounded-[4px] border-2 border-white overflow-hidden bg-[#F0F3F4] cursor-pointer"
              style={{
                marginLeft: index > 0 ? "-14px" : "0",
                zIndex: avatars.length - index,
              }}
            >
              {player.pfpUrl ? (
                <Image
                  src={player.pfpUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-[#F5BB1B] to-[#FF6B35]" />
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Text with animated count */}
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          delay: 0.3,
        }}
        className="font-display font-medium text-sm leading-[130%] text-center tracking-[-0.03em] text-[#99A0AE]"
      >
        {/* <motion.span
          key={displayCount}
          initial={{ opacity: 0, y: -10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 15,
          }}
          className="inline-block"
        >
          {displayCount}
        </motion.span>{" "} */}
        {displayCount === 1 ? "" : "people have"} {actionText}
      </motion.span>
    </div>
  );
}

export default PlayerAvatarStack;
