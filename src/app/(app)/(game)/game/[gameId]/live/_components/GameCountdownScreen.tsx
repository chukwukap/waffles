"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// Rotation angles from design specs
const AVATAR_ROTATIONS = [-8.71, 5.85, -3.57, 7.56];

interface GameCountdownScreenProps {
  onComplete: () => void;
  entrants?: Array<{ pfpUrl: string | null; username?: string }>;
}

/**
 * GameCountdownScreen - Video countdown before live game
 *
 * Plays video before entering the live game.
 * Video covers full viewport below header.
 * Shows logo at top and "X people have joined the game" with avatar stack.
 */
export function GameCountdownScreen({
  onComplete,
  entrants = [],
}: GameCountdownScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasEnded, setHasEnded] = useState(false);
  const [, setIsMuted] = useState(true);

  // Auto-play video on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video
      .play()
      .then(() => {
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.muted = false;
            setIsMuted(false);
          }
        }, 100);
      })
      .catch((err) => {
        console.error("[GameCountdown] Autoplay failed:", err);
      });
  }, []);

  // Handle video end
  const handleEnded = useCallback(() => {
    if (hasEnded) return;
    setHasEnded(true);
    onComplete();
  }, [hasEnded, onComplete]);

  // Handle tap to unmute
  const handleVideoTap = useCallback(() => {
    const video = videoRef.current;
    if (video && video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  }, []);

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-black overflow-hidden">
      {/* Video - covers full viewport below header */}
      <video
        ref={videoRef}
        src="https://res.cloudinary.com/dfqjfrf4m/video/upload/v1768850603/waffles-countdown-compressed_gjj8rv.mp4"
        autoPlay
        playsInline
        preload="auto"
        onEnded={handleEnded}
        onClick={handleVideoTap}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
      />

      {/* Logo and player stack at bottom center */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center z-10 gap-4"
        >
          {/* Logo with text */}
          <div className="flex flex-row items-center justify-center gap-1.5">
            <div className="relative w-8 h-8 shrink-0">
              <Image
                src="/logo.png"
                alt="Waffles"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <span className="font-body text-white text-3xl font-bold tracking-wide uppercase">
              WAFFLES
            </span>
          </div>

          {/* Player count - shows "X people have joined the game" */}
          <div className="flex flex-row justify-center items-center gap-2">
            {/* Avatar Stack - rotated rounded squares */}
            {entrants.length > 0 && (
              <div className="flex flex-row items-center">
                {entrants.slice(0, 4).map((player, index) => (
                  <motion.div
                    key={player.username || index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotate: AVATAR_ROTATIONS[index] || 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 20,
                      delay: 0.4 + index * 0.08,
                    }}
                    className="box-border w-[21px] h-[21px] rounded-[3px] overflow-hidden bg-[#F0F3F4] shrink-0"
                    style={{
                      marginLeft: index > 0 ? "-11px" : "0",
                      zIndex: 4 - index,
                      border: "1.5px solid #FFFFFF",
                    }}
                  >
                    {player.pfpUrl ? (
                      <Image
                        src={player.pfpUrl}
                        alt=""
                        width={21}
                        height={21}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-[#F5BB1B] to-[#FF6B35]" />
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Text - "X people have joined the game" */}
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="font-display font-medium text-base text-center tracking-[-0.03em] text-[#99A0AE]"
              style={{ lineHeight: "130%" }}
            >
              {entrants.length === 0
                ? "Be the first to join!"
                : `${entrants.length} ${entrants.length === 1 ? "person has" : "people have"
                } joined the game`}
            </motion.span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default GameCountdownScreen;
