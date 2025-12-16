"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useGameStore, selectMessages, selectOnlineCount, selectIsConnected } from "@/lib/game-store";
import { useLive } from "@/hooks/useLive";
import { cn } from "@/lib/utils";

// ==========================================
// TYPES
// ==========================================

interface GameChatProps {
    gameId: number;
}

// ==========================================
// CHAT MESSAGE COMPONENT
// ==========================================

const ChatMessage = memo(function ChatMessage({
    username,
    text,
    isOwn,
}: {
    username: string;
    text: string;
    isOwn: boolean;
}) {
    return (
        <div className={cn("flex gap-2 py-1", isOwn && "flex-row-reverse")}>
            <div
                className={cn(
                    "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                    isOwn
                        ? "bg-[var(--color-neon-pink)] text-black rounded-br-sm"
                        : "bg-white/10 text-white rounded-bl-sm"
                )}
            >
                {!isOwn && (
                    <span className="block text-xs text-white/50 mb-0.5">{username}</span>
                )}
                <p className="break-words">{text}</p>
            </div>
        </div>
    );
});

// ==========================================
// MAIN COMPONENT
// ==========================================

export function GameChat({ gameId }: GameChatProps) {
    const { context } = useMiniKit();
    const username = context?.user?.username ?? "Player";

    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Selectors
    const messages = useGameStore(selectMessages);
    const onlineCount = useGameStore(selectOnlineCount);
    const isConnected = useGameStore(selectIsConnected);

    // Get sendChat from useLive (already connected in parent)
    const { sendChat } = useLive({ gameId, token: "", enabled: false });

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Handle send
    const handleSend = useCallback(() => {
        const trimmed = message.trim();
        if (!trimmed) return;

        sendChat(trimmed);
        setMessage("");
    }, [message, sendChat]);

    // Handle key press
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    // Toggle chat
    const toggleChat = () => setIsOpen((prev) => !prev);

    // Player count text
    const playerCountText =
        onlineCount === 1
            ? "1 player is active"
            : `${onlineCount} players are active`;

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                onClick={toggleChat}
                className={cn(
                    "fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-2 rounded-full",
                    "bg-white/10 backdrop-blur-md border border-white/20",
                    "text-white text-sm font-display",
                    "transition-all hover:bg-white/20",
                    isOpen && "bg-[var(--color-neon-pink)] text-black"
                )}
            >
                <span>💬</span>
                <span>{isOpen ? "Close" : "Chat"}</span>
                {!isOpen && messages.length > 0 && (
                    <span className="w-5 h-5 flex items-center justify-center bg-[var(--color-neon-pink)] text-black text-xs rounded-full">
                        {messages.length > 99 ? "99+" : messages.length}
                    </span>
                )}
            </button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-white/10 rounded-t-3xl"
                        style={{ maxHeight: "60vh" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <div>
                                <h3 className="text-white font-body text-lg">Game Chat</h3>
                                <p className="text-white/50 text-xs">
                                    {isConnected ? playerCountText : "Connecting..."}
                                </p>
                            </div>
                            <button
                                onClick={toggleChat}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-2" style={{ maxHeight: "calc(60vh - 120px)" }}>
                            {messages.length === 0 ? (
                                <p className="text-center text-white/30 py-8">
                                    No messages yet. Start the conversation!
                                </p>
                            ) : (
                                messages.map((msg: { id: string; username: string; pfpUrl: string | null; text: string }) => (
                                    <ChatMessage
                                        key={msg.id}
                                        username={msg.username}
                                        text={msg.text}
                                        isOwn={msg.username === username}
                                    />
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10">
                            <input
                                ref={inputRef}
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="flex-1 bg-white/10 text-white placeholder-white/30 px-4 py-2 rounded-full outline-none focus:ring-2 focus:ring-[var(--color-neon-pink)]"
                                maxLength={500}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!message.trim()}
                                className={cn(
                                    "w-10 h-10 flex items-center justify-center rounded-full",
                                    "bg-[var(--color-neon-pink)] text-black",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                ➤
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
