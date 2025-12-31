"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useGameStore } from "@/components/providers/GameStoreProvider";
import { selectReactions } from "@/lib/game-store";

// ==========================================
// TYPES
// ==========================================

interface CheerBubble {
    id: number;
    xOffset: number; // Offset from base position
    scale: number;
    rotation: number;
    drift: number; // horizontal drift during float
    isSelf: boolean; // Whether this is from the current user
    xPosition: number; // Percentage across screen (0-100) for others' cheers
}

// ==========================================
// SINGLE BUBBLE COMPONENT
// ==========================================

function FloatingBubble({ bubble, onComplete }: { bubble: CheerBubble; onComplete: (id: number) => void }) {
    // Self cheers originate from bottom-right (where the button is)
    // Others' cheers originate from random positions across the bottom of the screen
    const positionStyle = bubble.isSelf
        ? {
            right: `calc(20px + ${-bubble.xOffset}px)`,
            bottom: "80px",
        }
        : {
            left: `${bubble.xPosition}%`,
            bottom: `${60 + Math.random() * 40}px`,
        };

    return (
        <div
            className="fixed pointer-events-none z-50"
            style={{
                ...positionStyle,
                animation: `cheer-float-${bubble.drift > 0 ? 'right' : 'left'} ${bubble.isSelf ? 2 : 2.5}s ease-out forwards`,
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
                    // Make others' cheers slightly more transparent to differentiate
                    opacity: bubble.isSelf ? 1 : 0.85,
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
    const { context } = useMiniKit();
    const currentUsername = context?.user?.username;

    // Create bubbles for self (from button position)
    const createSelfBubbles = useCallback((count: number = 3) => {
        const newBubbles: CheerBubble[] = [];

        for (let i = 0; i < count; i++) {
            newBubbles.push({
                id: bubbleCounter++,
                xOffset: Math.random() * 60 - 30, // Spread around button position (-30 to +30)
                scale: 0.8 + Math.random() * 0.5, // 0.8-1.3 scale
                rotation: Math.random() * 30 - 15, // -15 to 15 degrees
                drift: Math.random() * 40 - 20, // -20 to 20 px drift
                isSelf: true,
                xPosition: 0, // Not used for self
            });
        }

        setBubbles(prev => [...prev, ...newBubbles]);
    }, []);

    // Create bubbles for others (scattered across screen)
    const createOthersBubbles = useCallback((count: number = 3) => {
        const newBubbles: CheerBubble[] = [];

        for (let i = 0; i < count; i++) {
            newBubbles.push({
                id: bubbleCounter++,
                xOffset: 0, // Not used for others
                scale: 0.7 + Math.random() * 0.4, // 0.7-1.1 scale (slightly smaller)
                rotation: Math.random() * 40 - 20, // -20 to 20 degrees
                drift: Math.random() * 60 - 30, // -30 to 30 px drift (more variety)
                isSelf: false,
                xPosition: 10 + Math.random() * 80, // 10% to 90% across screen
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
                    // Check if this is from current user or someone else
                    const isFromSelf = reaction.username === currentUsername;

                    if (!isFromSelf) {
                        // Only show bubbles for OTHER users' reactions
                        // Self reactions are handled by triggerCheer (direct button press)
                        createOthersBubbles(Math.floor(Math.random() * 3) + 2); // 2-4 bubbles per cheer
                    }
                }
            }
        }
        lastReactionCount.current = reactions.length;
    }, [reactions, currentUsername, createOthersBubbles]);

    // Expose createSelfBubbles for local trigger (when user presses the button)
    useEffect(() => {
        (window as unknown as { triggerCheer?: () => void }).triggerCheer = () => {
            createSelfBubbles(3);
        };
        return () => {
            delete (window as unknown as { triggerCheer?: () => void }).triggerCheer;
        };
    }, [createSelfBubbles]);

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
