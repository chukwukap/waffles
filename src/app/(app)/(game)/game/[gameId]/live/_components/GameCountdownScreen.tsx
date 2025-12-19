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

    // Auto-play video on mount (must be muted for autoplay to work in browsers)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Try to play - browsers require muted for autoplay
        video.muted = true;
        video.play().then(() => {
            // Once playing, try to unmute after user interaction
            // For now, keep muted for reliable autoplay
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

    return (
        <div className="relative flex-1 flex flex-col min-h-0 bg-black overflow-hidden">
            {/* Video - covers full viewport below header */}
            <video
                ref={videoRef}
                src="/videos/vid.mp4"
                autoPlay
                playsInline
                muted
                preload="auto"
                onEnded={handleEnded}
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Skip button - appears after 3 seconds */}
            <AnimatePresence>
                {showSkip && !hasEnded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-8 left-0 right-0 flex justify-center z-10"
                    >
                        <button
                            onClick={handleSkip}
                            className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white font-display text-sm transition-colors border border-white/20"
                        >
                            Skip →
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default GameCountdownScreen;
