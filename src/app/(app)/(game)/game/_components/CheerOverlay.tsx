"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

// ==========================================
// TYPES
// ==========================================

interface CheerBubble {
    id: number;
    xOffset: number;
    scale: number;
    rotation: number;
    drift: number;
    isSelf: boolean;
    xPosition: number;
}

// Custom event for cheers (ephemeral - no store needed)
export const CHEER_EVENT = "waffle:cheer";

interface CheerEventDetail {
    isSelf: boolean;
}

// ==========================================
// FIRE CHEER (call this from anywhere)
// ==========================================

export function fireCheer(isSelf: boolean = true) {
    window.dispatchEvent(
        new CustomEvent<CheerEventDetail>(CHEER_EVENT, {
            detail: { isSelf },
        })
    );
}

// ==========================================
// SINGLE BUBBLE COMPONENT
// ==========================================

function FloatingBubble({ bubble, onComplete }: { bubble: CheerBubble; onComplete: (id: number) => void }) {
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
                    opacity: bubble.isSelf ? 1 : 0.85,
                }}
            />
        </div>
    );
}

// ==========================================
// CHEER OVERLAY COMPONENT
// ==========================================

let bubbleCounter = 0;

export function CheerOverlay() {
    const [bubbles, setBubbles] = useState<CheerBubble[]>([]);

    // Create bubbles
    const createBubbles = useCallback((isSelf: boolean) => {
        const count = isSelf ? 3 : Math.floor(Math.random() * 3) + 2;
        const newBubbles: CheerBubble[] = [];

        for (let i = 0; i < count; i++) {
            newBubbles.push({
                id: bubbleCounter++,
                xOffset: isSelf ? Math.random() * 60 - 30 : 0,
                scale: isSelf ? 0.8 + Math.random() * 0.5 : 0.7 + Math.random() * 0.4,
                rotation: Math.random() * 40 - 20,
                drift: Math.random() * 60 - 30,
                isSelf,
                xPosition: isSelf ? 0 : 10 + Math.random() * 80,
            });
        }

        setBubbles(prev => [...prev, ...newBubbles]);
    }, []);

    // Listen for cheer events
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<CheerEventDetail>).detail;
            createBubbles(detail.isSelf);
        };

        window.addEventListener(CHEER_EVENT, handler);
        return () => window.removeEventListener(CHEER_EVENT, handler);
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
                    0% { opacity: 1; transform: translateY(0) translateX(0); }
                    30% { opacity: 1; }
                    100% { opacity: 0; transform: translateY(-200px) translateX(40px); }
                }
                
                @keyframes cheer-float-left {
                    0% { opacity: 1; transform: translateY(0) translateX(0); }
                    30% { opacity: 1; }
                    100% { opacity: 0; transform: translateY(-200px) translateX(-40px); }
                }
            `}</style>
        </>
    );
}

export default CheerOverlay;
