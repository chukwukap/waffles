"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ForwardMessageIcon, MessageIcon } from "@/components/icons";
import { useGameStore } from "@/stores/gameStore";
import { useMiniUser } from "@/hooks/useMiniUser";

export default function ChatDrawer() {
  const [open, setOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage } = useGameStore();
  const user = useMiniUser();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || !user.fid) return;
    sendMessage(trimmed, {
      fid: user.fid,
      username: user.username,
      pfpUrl: user.pfpUrl,
    });
    setNewMessage("");
  };

  return (
    <>
      {/* Trigger Input */}
      <div
        className="absolute left-0 bottom-0 w-full mx-auto flex flex-row items-start px-4 pb-5 pt-3 gap-3 bg-[#0E0E0E] z-30"
        onClick={() => setOpen(true)}
      >
        <div className="flex flex-col justify-center items-start flex-grow bg-white/5 rounded-full px-5 py-3 gap-1">
          <input
            readOnly
            placeholder="Type..."
            className="bg-transparent font-brockmann font-medium text-[14px] leading-[130%] tracking-[-0.03em] text-white opacity-40 outline-none cursor-pointer w-20 min-w-[42px] h-[18px]"
          />
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-md font-display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="relative w-full mx-auto flex flex-col rounded-t-full bg-figma noise h-[85vh] max-h-[90dvh] sm:max-h-[600px] min-h-[60dvh] overflow-hidden"
              style={{
                width: "100%",
                borderTopLeftRadius: "1.25rem",
                borderTopRightRadius: "1.25rem",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex flex-row items-center justify-between px-4 pt-8 pb-3 border-b border-white/5 bg-[#191919] rounded-t-2xl font-body">
                <div className="flex flex-row items-center gap-2">
                  <MessageIcon />
                  <h2 className="font-pixel text-white text-lg md:text-xl select-none">
                    lobby CHAT
                  </h2>
                </div>
                <span className="font-pixel text-white text-base md:text-lg select-none">
                  00:10
                </span>
              </div>

              {/* Messages */}
              <div className="flex flex-col items-start gap-3 sm:gap-4 pb-4 pt-6 px-4 flex-1 min-h-0 overflow-y-scroll scrollbar-none w-full">
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className="flex flex-col items-start gap-2 w-full"
                    style={{ order: idx }}
                  >
                    <div className="flex flex-row items-center gap-1.5 sm:gap-2 min-h-5 mb-0.5">
                      <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                        {msg.avatarUrl ? (
                          <Image
                            src={msg.avatarUrl}
                            alt={msg.username}
                            width={20}
                            height={20}
                            className="w-5 h-5 object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs font-semibold">
                            {msg.username?.[0]?.toUpperCase() ?? "•"}
                          </span>
                        )}
                      </div>
                      <span className="ml-1 font-brockmann font-medium text-[0.92rem] leading-[130%] tracking-[-0.03em] text-white">
                        {msg.username}
                      </span>
                      <span className="mx-1 w-[0.28rem] h-[0.28rem] bg-[#D9D9D9] rounded-full inline-block" />
                      <span className="font-brockmann font-medium text-[0.72rem] leading-[130%] tracking-[-0.03em] text-[#99A0AE]">
                        {msg.time}
                      </span>
                    </div>

                    <div className="w-full bg-white/[0.10] border border-white/[0.03] rounded-[0px_0.75rem_0.75rem_0.75rem] px-4 py-3 flex flex-col justify-center">
                      <p className="font-brockmann font-medium text-base leading-[130%] tracking-[-0.03em] text-white break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="absolute left-0 bottom-0 w-full flex flex-row items-center bg-[#0E0E0E] px-4 py-5 gap-3 border-t border-white/5"
                style={{
                  minHeight: "min(90px,12vh)",
                  maxHeight: "18vh",
                }}
              >
                <div className="flex items-center bg-white/5 rounded-full flex-1 px-5 py-3">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a comment"
                    className="flex-1 bg-transparent outline-none text-white placeholder-white/40 text-base font-brockmann"
                  />
                </div>
                <AnimatePresence>
                  {newMessage.trim() && (
                    <motion.button
                      type="submit"
                      className="ml-3 bg-[#1B8FF5] rounded-full w-10 h-10 flex items-center justify-center active:scale-95 transition-transform shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
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
