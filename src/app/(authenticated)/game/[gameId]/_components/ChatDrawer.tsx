"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ForwardMessageIcon, MessageIcon } from "@/components/icons";
import { useAppStore } from "@/state/store";
import { useMiniUser } from "@/hooks/useMiniUser";
import { cn } from "@/lib/utils";
import { notify } from "@/components/ui/Toaster";

/**
 * A modal drawer component for displaying and sending chat messages within the game lobby or active game.
 */
export default function ChatDrawer() {
  const [open, setOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useAppStore((state) => state.messages);
  const sendMessageAction = useAppStore((state) => state.sendMessage);
  const activeGame = useAppStore((state) => state.activeGame);

  const user = useMiniUser();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [messages, open, scrollToBottom]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = newMessage.trim();
      if (
        !trimmed ||
        !user.fid ||
        !user.username ||
        !user.pfpUrl ||
        !sendMessageAction
      )
        return;

      setNewMessage("");

      try {
        await sendMessageAction(trimmed, {
          fid: user.fid,
          username: user.username,
          pfpUrl: user.pfpUrl,
        });
        scrollToBottom();
      } catch (error) {
        console.error("Failed to send message:", error);
        notify.error("Failed to send message.");
      }
    },
    [newMessage, user, sendMessageAction, scrollToBottom]
  );

  return (
    <>
      {!open && (
        <div
          className="fixed bottom-0 left-0 right-0 w-full max-w-screen-sm mx-auto flex flex-row items-start px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 gap-3 bg-figma z-30 border-t border-white/5 cursor-pointer"
          onClick={() => setOpen(true)}
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-label="Open chat"
        >
          <div className="flex flex-col justify-center items-start grow bg-white/5 rounded-full px-5 py-3 gap-1">
            <input
              readOnly
              placeholder="Type..."
              className="bg-transparent font-display font-medium text-[14px] leading-[130%] tracking-[-0.03em] text-white opacity-40 outline-none cursor-pointer w-full h-[18px]"
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-md font-display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="relative w-full mx-auto flex flex-col rounded-t-2xl bg-figma noise h-[85vh] max-h-[90dvh] sm:max-h-[600px] min-h-[60dvh] overflow-hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="chat-drawer-title"
            >
              <div className="flex flex-row items-center justify-between px-4 pt-8 pb-3 border-b border-white/5 bg-[#191919] rounded-t-2xl font-body shrink-0">
                <div className="flex flex-row items-center gap-2">
                  <MessageIcon />
                  <h2
                    id="chat-drawer-title"
                    className="text-white text-lg md:text-xl select-none"
                  >
                    lobby CHAT
                  </h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="text-white/70 hover:text-white p-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="flex flex-col items-start gap-3 sm:gap-4 pb-4 pt-6 px-4 flex-1 min-h-0 overflow-y-scroll scrollbar-none w-full">
                {messages.map((msg, idx) => {
                  const username = msg.user?.name ?? "anon";
                  const avatar = msg.user?.imageUrl ?? null;
                  const time = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  const isCurrentUser = msg.userId === user.fid;

                  return (
                    <div
                      key={msg.id ?? idx}
                      className={cn(
                        "flex flex-col items-start gap-2 w-full",
                        isCurrentUser && "items-end"
                      )}
                      style={{ order: idx }}
                    >
                      {!isCurrentUser && (
                        <div className="flex flex-row items-center gap-1.5 sm:gap-2 min-h-5 mb-0.5">
                          <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                            {avatar ? (
                              <Image
                                src={avatar}
                                alt={`${username}'s avatar`}
                                width={20}
                                height={20}
                                className="w-5 h-5 object-cover"
                              />
                            ) : (
                              <span className="text-gray-400 text-xs font-semibold">
                                {username?.[0]?.toUpperCase() ?? "•"}
                              </span>
                            )}
                          </div>
                          <span className="ml-1 font-display font-medium text-[0.92rem] leading-[130%] tracking-[-0.03em] text-white">
                            {username}
                          </span>
                          <span className="mx-1 w-[0.28rem] h-[0.28rem] bg-[#D9D9D9] rounded-full inline-block" />
                          <span className="font-display font-medium text-[0.72rem] leading-[130%] tracking-[-0.03em] text-[#99A0AE]">
                            {time}
                          </span>
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] sm:max-w-[70%] border rounded-[0.75rem] px-4 py-3 flex flex-col justify-center", // Base bubble styles
                          isCurrentUser
                            ? "bg-blue-600/30 border-blue-500/20 rounded-br-none"
                            : "bg-white/[0.08] border-white/[0.05] rounded-bl-none"
                        )}
                      >
                        <p className="font-display font-medium text-base leading-[130%] tracking-[-0.03em] text-white break-words">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex flex-row items-center bg-[#0E0E0E] px-4 py-5 gap-3 border-t border-white/5 shrink-0"
                style={{
                  paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
                }}
              >
                <div className="flex items-center bg-white/5 rounded-full flex-1 px-5 py-3">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a comment..."
                    className="flex-1 bg-transparent outline-none text-white placeholder-white/40 text-base font-display"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                </div>
                {/* Animated Send Button */}
                <AnimatePresence>
                  {newMessage.trim() && (
                    <motion.button
                      type="submit"
                      className="ml-3 bg-[#1B8FF5] rounded-full w-10 h-10 flex items-center justify-center active:scale-95 transition-transform shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shrink-0"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      aria-label="Send message"
                    >
                      <ForwardMessageIcon />
                    </motion.button>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
