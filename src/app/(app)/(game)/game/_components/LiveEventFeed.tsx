"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveFeed } from "@/hooks/useLiveFeed";

// Helper function to get first letter of username
const getInitial = (username: string): string => {
  return username?.charAt(0)?.toUpperCase() || "?";
};

// Avatar component with fallback to initials
function AvatarWithFallback({
  src,
  username,
}: {
  src: string;
  username: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div
        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-semibold"
        style={{
          backgroundColor: "#4F46E5", // Indigo background for initials
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
}: {
  maxEvents: number;
  gameId: number | null;
}) {
  const { events } = useLiveFeed({ gameId, maxEvents });

  // Calculate opacity based on index.
  // The newest event (last in the array) has the highest opacity.
  const getOpacity = (index: number) => {
    const positionFromEnd = events.length - 1 - index;
    // 1.0, 0.7, 0.4, 0.2, 0.1 (for 5 events)
    if (positionFromEnd === 0) return 1.0; // Newest
    if (positionFromEnd === 1) return 0.7;
    if (positionFromEnd === 2) return 0.4;
    if (positionFromEnd === 3) return 0.2;
    return 0.1; // Oldest
  };

  return (
    // Main container.
    // No background, inherits from parent.
    // Set width and height as requested, but max-w-full makes it responsive.
    <div className="w-full max-w-[377px] h-[130px] p-2 px-4 flex flex-col justify-end overflow-hidden">
      <div className="flex flex-col gap-2 pt-4">
        <AnimatePresence initial={false}>
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              // This style applies the dynamic opacity for the fade
              style={{ opacity: getOpacity(index) }}
              className="flex items-center gap-2"
              // Animation for new events appearing
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: getOpacity(index), y: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {event.avatar ? (
                <AvatarWithFallback
                  src={event.avatar}
                  username={event.username}
                />
              ) : (
                <div
                  className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-semibold"
                  style={{
                    backgroundColor: "#4F46E5", // Indigo background for initials
                  }}
                >
                  {getInitial(event.username)}
                </div>
              )}
              <div className="text-sm truncate">
                {event.type === "join" ? (
                  <span className="text-gray-400 italic font-display font-bold">
                    <span className="font-body">{event.username}</span> joined
                    the lobby
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-gray-200 ">
                      {event.username}
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
