"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useGameStore, selectReactions } from "@/lib/game-store";

// ==========================================
// TYPES
// ==========================================

interface CheerBubble {
    id: number;
    xOffset: number; // Offset from base position
    scale: number;
    rotation: number;
    drift: number; // horizontal drift during float
}

// ==========================================
// SINGLE BUBBLE COMPONENT
// ==========================================

function FloatingBubble({ bubble, onComplete }: { bubble: CheerBubble; onComplete: (id: number) => void }) {
    return (
        <div
            className="fixed pointer-events-none z-50"
            style={{
                // Position at bottom-right, where cheer button is
                right: `calc(20px + ${-bubble.xOffset}px)`,
                bottom: "80px",
                animation: `cheer-float-${bubble.drift > 0 ? 'right' : 'left'} 2s ease-out forwards`,
            }}
            onAnimationEnd={() => onComplete(bubble.id)}
        >
            <Image
                src="/images/icons/cheer.svg"
                alt=""
                width={32}
                height={32}
                className="object-contain"
                style={{
                    transform: `scale(${bubble.scale}) rotate(${bubble.rotation}deg)`,
                }}
            />
        </div>
    );
}

// ==========================================
// GLOBAL CHEER OVERLAY COMPONENT
// ==========================================

let bubbleCounter = 0;

export function CheerOverlay() {
    const [bubbles, setBubbles] = useState<CheerBubble[]>([]);
    const reactions = useGameStore(selectReactions);
    const lastReactionCount = useRef(reactions.length);

    // Create bubbles - always from the same bottom-right position for all players
    const createBubbles = useCallback((count: number = 3) => {
        const newBubbles: CheerBubble[] = [];

        for (let i = 0; i < count; i++) {
            newBubbles.push({
                id: bubbleCounter++,
                xOffset: Math.random() * 60 - 30, // Spread around button position (-30 to +30)
                scale: 0.8 + Math.random() * 0.5, // 0.8-1.3 scale
                rotation: Math.random() * 30 - 15, // -15 to 15 degrees
                drift: Math.random() * 40 - 20, // -20 to 20 px drift
            });
        }

        setBubbles(prev => [...prev, ...newBubbles]);
    }, []);

    // Listen for new reactions from other players
    useEffect(() => {
        if (reactions.length > lastReactionCount.current) {
            // New reactions came in
            const newCount = reactions.length - lastReactionCount.current;
            for (let i = 0; i < newCount; i++) {
                const reaction = reactions[reactions.length - 1 - i];
                if (reaction?.type === "cheer") {
                    createBubbles(Math.floor(Math.random() * 3) + 2); // 2-4 bubbles per cheer
                }
            }
        }
        lastReactionCount.current = reactions.length;
    }, [reactions, createBubbles]);

    // Expose createBubbles for local trigger
    useEffect(() => {
        (window as unknown as { triggerCheer?: () => void }).triggerCheer = () => {
            createBubbles(3);
        };
        return () => {
            delete (window as unknown as { triggerCheer?: () => void }).triggerCheer;
        };
    }, [createBubbles]);

    const removeBubble = useCallback((id: number) => {
        setBubbles(prev => prev.filter(b => b.id !== id));
    }, []);

    if (bubbles.length === 0) return null;

    return (
        <>
            {bubbles.map(bubble => (
                <FloatingBubble
                    key={bubble.id}
                    bubble={bubble}
                    onComplete={removeBubble}
                />
            ))}

            <style jsx global>{`
                @keyframes cheer-float-right {
                    0% {
                        opacity: 1;
                        transform: translateY(0) translateX(0);
                    }
                    30% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-200px) translateX(40px);
                    }
                }
                
                @keyframes cheer-float-left {
                    0% {
                        opacity: 1;
                        transform: translateY(0) translateX(0);
                    }
                    30% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-200px) translateX(-40px);
                    }
                }
            `}</style>
        </>
    );
}

export default CheerOverlay;
