"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameEvent } from "@/hooks/usePartyGame";

// Helper function to get first letter of username
const getInitial = (username: string): string => {
  return username?.charAt(0)?.toUpperCase() || "?";
};

// Avatar component with fallback to initials
function AvatarWithFallback({
  src,
  username,
}: {
  src: string | null;
  username: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div
        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-semibold"
        style={{
          backgroundColor: "#4F46E5",
        }}
      >
        {getInitial(username)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="avatar"
      width={24}
      height={24}
      className="w-6 h-6 rounded-full shrink-0"
      onError={() => setImageError(true)}
    />
  );
}

// --- LiveEventFeed Component ---
// Shows real-time game events (chat messages and player joins)
export default function LiveEventFeed({
  maxEvents = 5,
  gameId,
  initialEvents = [],
}: {
  maxEvents: number;
  gameId: number | null;
  initialEvents?: GameEvent["payload"][];
}) {
  const events = initialEvents.slice(-maxEvents);

  const getOpacity = (index: number) => {
    const positionFromEnd = events.length - 1 - index;
    if (positionFromEnd === 0) return 1.0;
    if (positionFromEnd === 1) return 0.7;
    if (positionFromEnd === 2) return 0.4;
    if (positionFromEnd === 3) return 0.2;
    return 0.1;
  };

  return (
    <div className="w-full max-w-[377px] h-[130px] p-2 px-4 flex flex-col justify-end overflow-hidden">
      <div className="flex flex-col gap-2 pt-4">
        <AnimatePresence initial={false}>
          {events.map((event, index) => (
            <motion.div
              key={`${event.type}-${event.user.fid}-${index}`}
              style={{ opacity: getOpacity(index) }}
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: getOpacity(index), y: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <AvatarWithFallback
                src={event.user.pfpUrl}
                username={event.user.username}
              />
              <div className="text-sm truncate">
                {event.type === "join" ? (
                  <span className="text-gray-400 italic font-display font-bold">
                    <span className="font-body">{event.user.username}</span> joined
                    the lobby
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-gray-200 ">
                      {event.user.username}
                    </span>
                    <span className="text-gray-300 ml-2 font-display">
                      {event.content}
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

