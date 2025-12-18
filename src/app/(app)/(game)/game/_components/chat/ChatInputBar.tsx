"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { UsersIcon } from "@/components/icons";
import { useGameStore, selectOnlineCount, selectSendReaction } from "@/lib/game-store";

// ==========================================
// TYPES
// ==========================================

interface ChatInputBarProps {
    onOpen: () => void;
}

interface WaffleBubble {
    id: number;
    x: number;
    scale: number;
    rotation: number;
}

// ==========================================
// LOCAL BUBBLE (for immediate feedback)
// ==========================================

function LocalBubble({ bubble, onComplete }: { bubble: WaffleBubble; onComplete: (id: number) => void }) {
    return (
        <div
            className="absolute pointer-events-none"
            style={{
                bottom: "100%",
                right: `${bubble.x}px`,
                animation: "local-bubble-float 1s ease-out forwards",
            }}
            onAnimationEnd={() => onComplete(bubble.id)}
        >
            <Image
                src="/images/icons/cheer.svg"
                alt=""
                width={24}
                height={18}
                className="object-contain"
                style={{
                    transform: `scale(${bubble.scale}) rotate(${bubble.rotation}deg)`,
                }}
            />
        </div>
    );
}

// ==========================================
// COMPONENT
// ==========================================

/**
 * ChatInputBar - Trigger button to open chat drawer
 * 
 * Shows active count on left, "Type..." placeholder button, and waffle cheer button.
 * Clicking the waffle creates animated bubbles that float up.
 */
export function ChatInputBar({ onOpen }: ChatInputBarProps) {
    const activeCount = useGameStore(selectOnlineCount);
    const sendReaction = useGameStore(selectSendReaction);
    const [bubbles, setBubbles] = useState<WaffleBubble[]>([]);
    const [bubbleIdCounter, setBubbleIdCounter] = useState(0);

    const handleWaffleClick = useCallback(() => {
        // Create local bubble for immediate feedback
        const newBubble: WaffleBubble = {
            id: bubbleIdCounter,
            x: Math.random() * 20 - 10,
            scale: 0.8 + Math.random() * 0.4,
            rotation: Math.random() * 30 - 15,
        };

        setBubbleIdCounter(prev => prev + 1);
        setBubbles(prev => [...prev, newBubble]);

        // Trigger global bubbles for local user
        (window as unknown as { triggerCheer?: () => void }).triggerCheer?.();

        // Broadcast cheer reaction to all players via dedicated channel
        sendReaction("cheer");
    }, [bubbleIdCounter, sendReaction]);

    const removeBubble = useCallback((id: number) => {
        setBubbles(prev => prev.filter(b => b.id !== id));
    }, []);

    return (
        <>
            <div className="flex items-center gap-2.5">
                {/* Active count on left */}
                <div
                    className="flex items-center gap-1 shrink-0"
                    role="status"
                    aria-live="polite"
                >
                    <UsersIcon className="w-4 h-4 text-[#B93814]" aria-hidden="true" />
                    <span
                        className="font-display"
                        style={{ fontSize: "16px", lineHeight: "130%", letterSpacing: "-0.03em", color: "#B93814" }}
                    >
                        {activeCount}
                    </span>
                </div>

                {/* Trigger button - opens drawer */}
                <button
                    onClick={onOpen}
                    className="flex-1 flex items-center hover:bg-white/[0.07] transition-all"
                    style={{
                        height: "46px",
                        padding: "14px 16px",
                        background: "rgba(255, 255, 255, 0.05)",
                        borderRadius: "900px",
                    }}
                    aria-label="Open chat"
                >
                    <span
                        className="flex-1 font-display text-left"
                        style={{ fontSize: "14px", lineHeight: "130%", letterSpacing: "-0.03em", color: "#FFFFFF", opacity: 0.4 }}
                    >
                        Type...
                    </span>
                </button>

                {/* Waffle Cheer Button */}
                <button
                    onClick={handleWaffleClick}
                    className="relative shrink-0 flex items-center justify-center active:scale-90 transition-transform"
                    aria-label="Send waffle cheer"
                >
                    <Image
                        src="/images/icons/cheer.svg"
                        alt="cheer"
                        width={29}
                        height={18}
                        className="object-contain"
                    />

                    {/* Local floating bubbles for immediate feedback */}
                    {bubbles.map(bubble => (
                        <LocalBubble
                            key={bubble.id}
                            bubble={bubble}
                            onComplete={removeBubble}
                        />
                    ))}
                </button>
            </div>

            {/* CSS Animation */}
            <style jsx global>{`
                @keyframes local-bubble-float {
                    0% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-60px);
                    }
                }
            `}</style>
        </>
    );
}

export default ChatInputBar;
