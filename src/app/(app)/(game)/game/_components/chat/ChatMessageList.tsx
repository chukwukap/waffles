"use client";

import { useRef, useEffect, useState, useImperativeHandle, forwardRef, memo } from "react";
import { ChatComment } from "./ChatComment";
import { useGameStore, selectMessages, type ChatMessage } from "@/lib/game-store";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

// ==========================================
// TYPES
// ==========================================

interface ChatMessageListProps {
    className?: string;
}

export interface ChatMessageListRef {
    scrollToBottom: () => void;
}

interface CommentType {
    id: string;
    name: string;
    time: string;
    message: string;
    avatarUrl: string | null;
    isCurrentUser: boolean;
    status: "sent" | "pending" | "error";
}

// ==========================================
// HELPERS
// ==========================================

const mapMessageToComment = (msg: ChatMessage, currentUsername?: string): CommentType => ({
    id: msg.id,
    name: msg.username,
    time: new Date(msg.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }),
    message: msg.text,
    avatarUrl: msg.pfpUrl,
    isCurrentUser: msg.username === currentUsername,
    status: "sent",
});

// ==========================================
// COMPONENT
// ==========================================

export const ChatMessageList = forwardRef<ChatMessageListRef, ChatMessageListProps>(
    function ChatMessageList({ className = "" }, ref) {
        const listRef = useRef<HTMLDivElement>(null);
        const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
        const [showNewMessages, setShowNewMessages] = useState(false);

        const { context: miniKitContext } = useMiniKit();
        const username = miniKitContext?.user?.username ?? "Player";

        const storeMessages = useGameStore(selectMessages);
        const comments = storeMessages.map((m) => mapMessageToComment(m, username));

        // Expose scrollToBottom via ref
        useImperativeHandle(ref, () => ({
            scrollToBottom: () => {
                if (listRef.current) {
                    listRef.current.scrollTo({
                        top: listRef.current.scrollHeight,
                        behavior: "smooth",
                    });
                    setShouldAutoScroll(true);
                    setShowNewMessages(false);
                }
            },
        }));

        // Auto-scroll when new messages arrive
        useEffect(() => {
            if (shouldAutoScroll && listRef.current) {
                listRef.current.scrollTop = listRef.current.scrollHeight;
            } else if (!shouldAutoScroll && comments.length > 0) {
                setShowNewMessages(true);
            }
        }, [comments, shouldAutoScroll]);

        // Handle scroll events
        const handleScroll = () => {
            if (!listRef.current) return;
            const { scrollTop, scrollHeight, clientHeight } = listRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShouldAutoScroll(isNearBottom);
            if (isNearBottom) {
                setShowNewMessages(false);
            }
        };

        const scrollToBottom = () => {
            if (listRef.current) {
                listRef.current.scrollTo({
                    top: listRef.current.scrollHeight,
                    behavior: "smooth",
                });
                setShouldAutoScroll(true);
                setShowNewMessages(false);
            }
        };

        return (
            <div className={`relative flex-1 flex flex-col ${className}`}>
                <div
                    ref={listRef}
                    onScroll={handleScroll}
                    className="scrollbox-transparent flex-1 overflow-y-auto px-4"
                >
                    <div className="flex flex-col gap-2 py-4">
                        {comments.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-white/40 text-sm py-8">
                                No messages yet. Start the conversation!
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <ChatComment
                                    key={comment.id}
                                    name={comment.name}
                                    time={comment.time}
                                    message={comment.message}
                                    avatarUrl={comment.avatarUrl}
                                    isCurrentUser={comment.isCurrentUser}
                                    status={comment.status}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }
);

export default ChatMessageList;
