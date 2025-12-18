"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChatIcon, SendIcon } from "@/components/icons";
import Backdrop from "@/components/ui/Backdrop";
import { ChatMessageList } from "./ChatMessageList";
import { useGameStore, selectIsConnected, selectSendChat } from "@/lib/game-store";

// ==========================================
// TYPES
// ==========================================

interface ChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

// ==========================================
// COMPONENT
// ==========================================

export function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const messageListRef = useRef<{ scrollToBottom: () => void }>(null);

    const isConnected = useGameStore(selectIsConnected);
    const sendChat = useGameStore(selectSendChat);

    // Focus input when drawer opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            if (!message.trim() || isSubmitting) return;

            setIsSubmitting(true);
            const currentMessage = message.trim();
            setMessage("");

            try {
                sendChat(currentMessage);
                setTimeout(() => messageListRef.current?.scrollToBottom(), 100);
            } catch (err) {
                console.error("Failed to send:", err);
                setMessage(currentMessage);
            } finally {
                setIsSubmitting(false);
                inputRef.current?.focus();
            }
        },
        [message, isSubmitting, sendChat]
    );

    const hasText = message.trim().length > 0;

    return (
        <>
            <Backdrop isOpen={isOpen} onClose={onClose} />

            {/* Drawer Panel */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col
                    h-[calc(85vh-138px)] rounded-t-[20px] bg-[#0E0E0E]
                    transition-transform duration-300 ease-out
                    ${isOpen ? "translate-y-0" : "translate-y-full"}`}
            >
                {/* Header */}
                <header className="relative flex h-[56px] w-full shrink-0 items-center border-b border-white/10 bg-[#191919] px-6 py-3 rounded-t-[20px]">
                    {/* Grabber */}
                    <button
                        onClick={onClose}
                        className="absolute top-2 left-1/2 h-3 w-14 -translate-x-1/2 rounded-full group transition-all focus:outline-none"
                        aria-label="Close chat"
                    >
                        <div className="absolute top-1/2 left-1/2 h-[4px] w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 group-hover:bg-white/60 transition-all" />
                    </button>

                    {/* Title */}
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ChatIcon className="w-7 h-7 text-[#3795F6] -ml-2" />
                            <span className="font-bold uppercase text-white font-body tracking-[0.04em] text-[1.40rem] select-none">
                                LOBBY&nbsp;CHAT
                            </span>
                        </div>

                        {!isConnected && (
                            <span className="text-white/40 text-xs">Connecting...</span>
                        )}
                    </div>
                </header>

                {/* Messages */}
                <ChatMessageList ref={messageListRef} className="flex-1 min-h-0" />

                {/* Input */}
                <div className="shrink-0 px-4 py-3 border-t border-white/10">
                    <form
                        onSubmit={handleSubmit}
                        className="flex h-[46px] items-center gap-3 rounded-full bg-white/5 px-4"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a comment"
                            disabled={isSubmitting || !isConnected}
                            className="flex-1 font-display bg-transparent text-sm font-medium text-white placeholder:text-white/40
                         focus:outline-none disabled:opacity-50"
                            style={{ letterSpacing: "-0.03em" }}
                        />

                        <button
                            type="submit"
                            disabled={!hasText || isSubmitting}
                            className={`flex h-[30px] w-[50px] items-center justify-center rounded-full bg-blue-500
                         transition-all duration-200
                         ${hasText && !isSubmitting ? "scale-100 opacity-100" : "scale-50 opacity-0"}
                         ${!hasText || isSubmitting ? "pointer-events-none" : ""}
                         hover:bg-blue-400 active:bg-blue-600`}
                            aria-label="Send message"
                        >
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default ChatDrawer;
