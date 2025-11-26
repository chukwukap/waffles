"use client";
import { useState, useRef, useEffect } from "react";
import { ChatIcon, SendIcon, UsersIcon } from "@/components/icons";
import Backdrop from "@/components/ui/Backdrop";
import { ChatComment } from "./ChatComment";
import { useGameEvents } from "@/hooks/useGameEvents";
import { sendMessageAction } from "@/actions/chat";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useSound } from "@/components/providers/SoundContext";
import { ChatWithUser } from "@/lib/types";
import { sendMessageSchema } from "@/lib/schemas";
import { useUser } from "@/hooks/useUser";

interface ChatCommentType {
  id: number;
  name: string;
  time: string;
  message: string;
  avatarUrl: string | null;
  isCurrentUser?: boolean;
  status?: "pending" | "sent" | "error";
  fid?: number; // Store FID to help identify own messages
}

export const Chat = ({
  gameId,
  activeCount: initialActiveCount = 0,
  onStatsUpdate,
}: {
  gameId: number | null;
  activeCount?: number;
  onStatsUpdate?: (count: number) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const { user } = useUser(); // Get full user details for optimistic UI
  const { playSound } = useSound();
  const [message, setMessage] = useState("");
  const [comments, setComments] = useState<ChatCommentType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeCount, setActiveCount] = useState(initialActiveCount);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showNewMessages, setShowNewMessages] = useState(false);

  // Subscribe to real-time chat events
  useGameEvents({
    gameId,
    enabled: isOpen && !!gameId,
    onChat: (chatEvent) => {
      const isMyMessage = !!(fid && chatEvent.user.fid === Number(fid));

      const comment: ChatCommentType = {
        id: chatEvent.id,
        name: chatEvent.user.username,
        time: new Date(chatEvent.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        message: chatEvent.message,
        avatarUrl: chatEvent.user.pfpUrl,
        isCurrentUser: isMyMessage,
        status: "sent",
        fid: chatEvent.user.fid,
      };

      setComments((prev) => {
        // Check if we have this message already (by ID)
        const exists = prev.some((c) => c.id === comment.id);
        if (exists) return prev;

        // If this is my message, we might have a pending version
        if (isMyMessage) {
          // Find a pending message with the same content
          // This is a simple heuristic. For more robustness, we could use a client-generated ID.
          const pendingIndex = prev.findIndex(c =>
            c.status === "pending" &&
            c.message === comment.message &&
            c.isCurrentUser
          );

          if (pendingIndex !== -1) {
            // Replace pending message with real one
            const newComments = [...prev];
            newComments[pendingIndex] = comment;
            return newComments;
          }
        }

        return [...prev, comment];
      });

      if (!shouldAutoScroll && !isMyMessage) {
        setShowNewMessages(true);
      }
    },
    onStats: (stats) => {
      setActiveCount(stats.onlineCount);
      onStatsUpdate?.(stats.onlineCount);
    },
  });

  // Load initial chat messages when opening
  useEffect(() => {
    if (!isOpen || !gameId) return;

    // Auto-focus input when drawer opens
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300); // Wait for drawer animation

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat?gameId=${gameId}`);
        if (!response.ok) throw new Error("Failed to fetch messages");

        const messages: ChatWithUser[] = await response.json();
        const formattedComments: ChatCommentType[] = messages.map((msg) => ({
          id: msg.id,
          name: msg.user.username ?? "anon",
          time: new Date(msg.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          message: msg.text,
          avatarUrl: msg.user.pfpUrl,
          isCurrentUser: fid ? msg.user.fid === Number(fid) : false,
          status: "sent",
          fid: msg.user.fid,
        }));

        setComments(formattedComments);
        // Force scroll to bottom on initial load
        setTimeout(() => {
          if (chatListRef.current) {
            chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
          }
        }, 100);
      } catch (error) {
        console.error("Error fetching chat messages:", error);
      }
    };

    fetchMessages();
  }, [isOpen, gameId, fid]);

  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = () => {
    if (!chatListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatListRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
    if (isNearBottom) {
      setShowNewMessages(false);
    }
  };

  // Auto-scroll effect
  useEffect(() => {
    if (shouldAutoScroll && chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [comments, shouldAutoScroll]);

  const scrollToBottom = () => {
    if (chatListRef.current) {
      chatListRef.current.scrollTo({
        top: chatListRef.current.scrollHeight,
        behavior: "smooth",
      });
      setShouldAutoScroll(true);
      setShowNewMessages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validation = sendMessageSchema.shape.message.safeParse(message);
    if (!validation.success || !gameId || !fid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    playSound("click");

    const currentMessage = message.trim();
    setMessage("");
    inputRef.current?.focus();

    // Optimistic Update
    const tempId = -Date.now(); // Negative ID for temp messages
    const optimisticComment: ChatCommentType = {
      id: tempId,
      name: user?.username || "You",
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      message: currentMessage,
      avatarUrl: user?.pfpUrl || null,
      isCurrentUser: true,
      status: "pending",
      fid: Number(fid),
    };

    setComments(prev => [...prev, optimisticComment]);
    setShouldAutoScroll(true);

    // Scroll to the new message
    setTimeout(() => scrollToBottom(), 100);

    const result = await sendMessageAction({
      gameId,
      message: currentMessage,
      fid,
    });

    if (!result.success) {
      console.error("Failed to send message:", result.error);
      // Mark as error
      setComments(prev => prev.map(c =>
        c.id === tempId ? { ...c, status: "error" } : c
      ));
      setMessage(currentMessage); // Restore text so user can try again
    } else {
      // Update the optimistic message with the real ID (if we want, or wait for SSE)
      // Ideally, we wait for SSE to replace it, but we can also update status to 'sent' here
      // to give immediate feedback if SSE is slightly delayed.
      // However, since we rely on SSE for the "true" state, let's just leave it as pending 
      // until the SSE event arrives and replaces it. 
      // BUT, if SSE is fast, it might arrive before this function returns.
      // Let's just update the ID if we can, but we don't have the full DB object here.
      // We'll rely on the SSE handler to replace it.
    }

    setIsSubmitting(false);
  };

  const hasText = message.trim().length > 0;

  return (
    <>
      <Backdrop isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex h-[calc(85vh-138px)] w-full flex-col
                    rounded-t-[20px] bg-linear-to-b from-[#1E1E0E] to-black
                    transition-transform duration-500 ease-in-out
                    ${isOpen ? "translate-y-[-138px]" : "translate-y-full"}`}
      >
        {/* ... Header ... */}
        <header
          className="relative flex h-[56px] w-full shrink-0 items-center border-b border-white/10 bg-[#191919] px-6 py-3 rounded-t-[20px]"
          style={{
            minHeight: "56px",
          }}
        >
          {/* Grabber */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 left-1/2 h-3 w-14 -translate-x-1/2 rounded-full 
                       group transition-all focus:outline-none"
            aria-label="Close chat"
            tabIndex={0}
            style={{ zIndex: 10 }}
          >
            <div className="absolute top-1/2 left-1/2 h-[4px] w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 group-hover:bg-white/60 group-active:bg-white/80 transition-all" />
          </button>
          {/* The actual content */}
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <ChatIcon
                className="w-7 h-7 text-[#3795F6] -ml-2"
                style={{ minWidth: 28, minHeight: 28 }}
              />
              <span className="font-bold uppercase text-white font-body tracking-[0.04em] text-[1.40rem] select-none">
                LOBBY&nbsp;CHAT
              </span>
            </div>
            {/* Removed hardcoded timer */}
          </div>
        </header>

        {/* Messages Area */}
        <div
          ref={chatListRef}
          onScroll={handleScroll}
          className="scrollbox-transparent relative flex flex-1 flex-col overflow-y-auto px-4"
        >
          <div className="flex flex-col gap-2 py4 pb-4">
            {comments.length === 0 && (
              <div className="flex items-center justify-center h-full text-white/40 text-sm">
                No messages yet. Start the conversation!
              </div>
            )}
            {comments.map((comment) => (
              <ChatComment
                key={comment.id}
                name={comment.name}
                time={comment.time}
                message={comment.message}
                avatarUrl={comment.avatarUrl}
                isCurrentUser={comment.isCurrentUser}
                status={comment.status}
              />
            ))}
          </div>
        </div>

        {/* New Messages Indicator */}
        {showNewMessages && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-[140px] left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg z-10 animate-bounce"
          >
            New Messages ↓
          </button>
        )}
      </div>

      {/* Footer - Always Visible, above BottomNav */}
      <section className="fixed bottom-[60px] left-0 right-0 w-full shrink-0 bg-[#0E0E0E] px-4 py-3 z-40" aria-label="Chat controls">
        {isOpen ? (
          // When chat is open, show the working input form
          <form
            onSubmit={handleSubmit}
            onClick={() => inputRef.current?.focus?.()} // Click wrapper to focus input
            className="flex h-[46px] w-full items-center gap-3 rounded-full bg-white/5 px-4 mb-3 transition-all overflow-visible"
          >
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a comment"
              disabled={isSubmitting}
              className="flex-1 font-display bg-transparent text-sm font-medium text-white placeholder:text-white/40
                         focus:outline-none disabled:opacity-50"
              style={{ letterSpacing: "-0.03em" }}
            />
            {/* Send Button - appears when there is text */}
            <button
              type="submit"
              disabled={!hasText || isSubmitting}
              className={`flex h-[30px] w-[50px] items-center justify-center rounded-full bg-blue-500
                         transition-all duration-200 ease-in-out
                         ${hasText && !isSubmitting
                  ? "scale-100 opacity-100"
                  : "scale-50 opacity-0"
                }
                         ${!hasText || isSubmitting ? "pointer-events-none" : ""
                }
                         hover:bg-blue-400 active:bg-blue-600
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                         focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </form>
        ) : (
          // When chat is closed, show clickable trigger
          <button
            onClick={() => setIsOpen(true)}
            className="flex h-[46px] w-full items-center gap-3 rounded-full bg-white/5 px-4 mb-3 hover:bg-white/[0.07] transition-all"
            aria-label="Open chat"
          >
            <span className="flex-1 font-display text-sm font-medium text-white/40 text-left" style={{ letterSpacing: "-0.03em" }}>
              Type...
            </span>
          </button>
        )}

        {/* Active Player Count - only show when chat is closed */}
        {!isOpen && (
          <div className="flex items-center gap-2 px-2 justify-start" role="status" aria-live="polite">
            <UsersIcon className="w-4 h-[13.5px] text-[#B93814]" aria-hidden="true" />
            <span
              className="text-[#99A0AE] text-xs font-medium"
              style={{
                fontFamily: "Brockmann",
                lineHeight: "130%",
                letterSpacing: "-0.03em",
              }}
            >
              {activeCount} players are active in the chat
            </span>
          </div>
        )}
      </section>
    </>
  );
};
