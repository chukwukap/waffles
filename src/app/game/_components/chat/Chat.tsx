import { useState, useRef, useEffect } from "react";
import { ChatIcon, SendIcon } from "@/components/icons";
import Backdrop from "@/components/ui/Backdrop";
import { ChatComment } from "./ChatComment";
import { useGameEvents } from "@/hooks/useGameEvents";
import { sendMessageAction } from "@/actions/chat";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useSound } from "@/components/providers/SoundContext";

interface ChatCommentType {
  id: number;
  name: string;
  time: string;
  message: string;
  avatarUrl: string | null;
}

export const Chat = ({
  isOpen,
  onClose,
  gameId,
}: {
  isOpen: boolean;
  onClose: () => void;
  gameId: number | null;
}) => {
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const { playSound } = useSound();
  const [message, setMessage] = useState("");
  const [comments, setComments] = useState<ChatCommentType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time chat events
  useGameEvents({
    gameId,
    enabled: isOpen && !!gameId,
    onChat: (chatEvent) => {
      const comment: ChatCommentType = {
        id: chatEvent.id,
        name: chatEvent.user.name,
        time: new Date(chatEvent.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        message: chatEvent.message,
        avatarUrl: chatEvent.user.imageUrl,
      };
      setComments((prev) => [...prev, comment]);
    },
  });

  // Load initial chat messages when opening
  useEffect(() => {
    if (!isOpen || !gameId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat?gameId=${gameId}`);
        if (!response.ok) throw new Error("Failed to fetch messages");

        const messages = await response.json();
        const formattedComments: ChatCommentType[] = messages.map((msg: any) => ({
          id: msg.id,
          name: msg.user.name ?? "anon",
          time: new Date(msg.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          message: msg.message,
          avatarUrl: msg.user.imageUrl,
        }));

        setComments(formattedComments);
      } catch (error) {
        console.error("Error fetching chat messages:", error);
      }
    };

    fetchMessages();
  }, [isOpen, gameId]);

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() === "" || !gameId || !fid || isSubmitting) return;

    setIsSubmitting(true);
    playSound("click");

    const result = await sendMessageAction({
      gameId,
      message: message.trim(),
      fid,
    });

    if (result.success) {
      setMessage("");
    } else {
      console.error("Failed to send message:", result.error);
    }

    setIsSubmitting(false);
  };

  const hasText = message.trim().length > 0;

  return (
    <>
      <Backdrop isOpen={isOpen} onClose={onClose} />
      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex h-[600px] w-full flex-col
                    rounded-t-[20px] bg-linear-to-b from-[#1E1E0E] to-black
                    transition-transform duration-500 ease-in-out
                    ${isOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Header */}
        <header
          className="relative flex h-[56px] w-full shrink-0 items-center border-b border-white/10 bg-[#191919] px-6 py-3 rounded-t-[20px]"
          style={{
            minHeight: "56px",
          }}
        >
          {/* Grabber */}
          <button
            onClick={onClose}
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
            <span
              className="text-white font-bold text-[1.1rem] font-body tracking-tight select-none"
              style={{
                fontSize: "1.1rem",
                letterSpacing: "0.005em",
              }}
            >
              00:10
            </span>
          </div>
        </header>

        {/* Comment List */}
        <div
          ref={chatListRef}
          className="flex-1 space-y-3.5 overflow-y-auto p-4"
        >
          {comments.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/40">
              No messages yet. Be the first to chat!
            </div>
          ) : (
            comments.map((comment) => (
              <ChatComment
                key={comment.id}
                name={comment.name}
                time={comment.time}
                message={comment.message}
                avatarUrl={comment.avatarUrl}
              />
            ))
          )}
        </div>

        {/* Footer Input */}
        <footer className="h-[98px] w-full shrink-0 bg-[#0E0E0E] p-4 pt-5">
          <form
            onSubmit={handleSubmit}
            onClick={() => inputRef.current?.focus?.()} // Click wrapper to focus input
            className="flex h-[58px] w-full items-center gap-3 rounded-full bg-white/5 px-4 cursor-text" // Add cursor-text
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
                         ${
                           hasText && !isSubmitting
                             ? "scale-100 opacity-100"
                             : "scale-50 opacity-0"
                         }
                         ${!hasText || isSubmitting ? "pointer-events-none" : ""}
                         hover:bg-blue-400 active:bg-blue-600
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                         focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </form>
        </footer>
      </div>
    </>
  );
};
