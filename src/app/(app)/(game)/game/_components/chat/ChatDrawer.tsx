"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatIcon, SendIcon } from "@/components/icons";
import Backdrop from "@/components/ui/Backdrop";
import { ChatMessageList } from "./ChatMessageList";
import {
  useGameStore,
  selectIsConnected,
  selectSendChat,
} from "@/lib/game-store";
import { springs } from "@/lib/animations";
import { playSound } from "@/lib/sounds";

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
      setTimeout(() => inputRef.current?.focus(), 100);
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
        playSound("chatSend");
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

      {/* Drawer Panel with AnimatePresence for smooth mount/unmount */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col h-[calc(85vh-138px)] rounded-t-[20px]"
            style={{
              background: "linear-gradient(180deg, #1E1E1E 0%, #000000 100%)",
            }}
          >
            {/* Header */}
            <header
              className="relative flex h-[56px] w-full shrink-0 items-center border-b border-white/10 px-6 py-3 rounded-t-[20px]"
              style={{
                background: "linear-gradient(180deg, #1E1E1E 0%, #1A1A1A 100%)",
              }}
            >
              {/* Grabber with hover effect */}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-2 left-1/2 h-3 w-14 -translate-x-1/2 rounded-full group transition-all focus:outline-none"
                aria-label="Close chat"
              >
                <div className="absolute top-1/2 left-1/2 h-[4px] w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 group-hover:bg-white/60 transition-all" />
              </motion.button>

              {/* Title with entrance animation */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, ...springs.gentle }}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ChatIcon className="w-7 h-7 text-[#3795F6] -ml-2" />
                  <span className="font-bold uppercase text-white font-body tracking-[0.04em] text-[1.40rem] select-none">
                    LOBBY&nbsp;CHAT
                  </span>
                </div>

                {!isConnected && (
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-white/40 text-xs"
                  >
                    Connecting...
                  </motion.span>
                )}
              </motion.div>
            </header>

            {/* Messages */}
            <ChatMessageList ref={messageListRef} className="flex-1 min-h-0" />

            {/* Input with slide-up animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, ...springs.gentle }}
              className="shrink-0 px-4 py-3 border-t border-white/10"
            >
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

                {/* Animated send button */}
                <AnimatePresence mode="popLayout">
                  {hasText && !isSubmitting && (
                    <motion.button
                      type="submit"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileTap={{ scale: 0.9 }}
                      transition={springs.bouncy}
                      disabled={!hasText || isSubmitting}
                      className="flex h-[30px] w-[50px] items-center justify-center rounded-full bg-blue-500 hover:bg-blue-400 active:bg-blue-600"
                      aria-label="Send message"
                    >
                      <SendIcon />
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

export default ChatDrawer;
