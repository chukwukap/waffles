"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GameCountdownScreenProps {
    onComplete: () => void;
}

/**
 * GameCountdownScreen - Video countdown before live game
 *
 * Plays vid.mp4 before entering the live game.
 * Video covers full viewport below header.
 * Shows skip button after 3 seconds.
 */
export function GameCountdownScreen({ onComplete }: GameCountdownScreenProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [showSkip, setShowSkip] = useState(false);
    const [hasEnded, setHasEnded] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    // Auto-play video on mount
    // Start muted for autoplay, then try to unmute after short delay
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Start muted for reliable autoplay
        video.muted = true;
        video.play().then(() => {
            // After playback starts, try to unmute
            // This works in Farcaster miniapp context where user has interacted
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

    // Show skip button after 3 seconds
    useEffect(() => {
        const timeout = setTimeout(() => setShowSkip(true), 3000);
        return () => clearTimeout(timeout);
    }, []);

    // Handle video end
    const handleEnded = useCallback(() => {
        if (hasEnded) return;
        setHasEnded(true);
        onComplete();
    }, [hasEnded, onComplete]);

    // Handle skip
    const handleSkip = useCallback(() => {
        if (hasEnded) return;
        setHasEnded(true);
        videoRef.current?.pause();
        onComplete();
    }, [hasEnded, onComplete]);

    // Handle tap to unmute (fallback for browsers that block unmute)
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
                src="/videos/vid.mp4"
                autoPlay
                playsInline
                preload="auto"
                onEnded={handleEnded}
                onClick={handleVideoTap}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            />

            {/* Tap to unmute hint */}
            <AnimatePresence>
                {isMuted && !hasEnded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white/80 text-sm z-10"
                    >
                        Tap for sound 🔊
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skip button - appears after 3 seconds */}
            <AnimatePresence>
                {showSkip && !hasEnded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{
                            duration: 0.4,
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                        }}
                        className="absolute bottom-8 left-0 right-0 flex justify-center z-10"
                    >
                        <motion.button
                            onClick={handleSkip}
                            className="px-6 py-3 bg-white/20 backdrop-blur-md rounded-full text-white font-display text-sm border border-white/20"
                            whileHover={{
                                scale: 1.05,
                                backgroundColor: "rgba(255, 255, 255, 0.3)",
                                boxShadow: "0 0 30px rgba(255, 255, 255, 0.3)",
                            }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            Skip →
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default GameCountdownScreen;
