"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import PlayerAvatarStack from "../../../_components/PlayerAvatarStack";

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
export function GameCountdownScreen({ onComplete, recentPlayers = [] }: GameCountdownScreenProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasEnded, setHasEnded] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    // Auto-play video on mount
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = true;
        video.play().then(() => {
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.muted = false;
                    setIsMuted(false);
                }
            }, 100);
        }).catch((err) => {
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

            {/* Logo with text at top center */}
            <AnimatePresence>
                {!hasEnded && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="absolute top-4 left-0 right-0 flex justify-center z-10"
                    >
                        <div className="flex items-center gap-2">
                            <Image
                                src="/logo.png"
                                alt="Waffles"
                                width={40}
                                height={40}
                                className="w-10 h-10"
                                priority
                            />
                            <span className="font-body text-white text-2xl font-bold tracking-wide uppercase">
                                WAFFLES
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Player count - shows "X people have joined the game" */}
            <AnimatePresence>
                {!hasEnded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                        className="absolute bottom-8 left-0 right-0 flex justify-center z-10 px-6"
                    >
                        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-5 py-3 border border-white/10">
                            <PlayerAvatarStack
                                initialPlayers={recentPlayers}
                                actionText="joined the game"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default GameCountdownScreen;
