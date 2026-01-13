"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { PlayerAvatarStack } from "../../../_components/PlayerAvatarStack";

interface GameCountdownScreenProps {
  onComplete: () => void;
  recentPlayers?: Array<{ pfpUrl: string | null; username?: string }>;
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
  recentPlayers = [],
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
        src="https://res.cloudinary.com/dfqjfrf4m/video/upload/v1766449403/countdown_f88eeg.mp4"
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
          <div className="flex justify-center">
            <PlayerAvatarStack
              initialPlayers={recentPlayers}
              actionText="joined the game"
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default GameCountdownScreen;
