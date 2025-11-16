import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useGameEvents } from "@/hooks/useGameEvents";

type EventType = "join" | "chat";

interface Event {
  id: number;
  avatar: string | null;
  content: string;
  type: EventType;
  username: string;
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
  const [events, setEvents] = useState<Event[]>([]);

  // Handle chat events
  const handleChat = useCallback(
    (chatEvent: {
      id: number;
      user: { name: string; imageUrl: string | null };
      message: string;
    }) => {
      const newEvent: Event = {
        id: chatEvent.id,
        avatar: chatEvent.user.imageUrl,
        content: chatEvent.message,
        type: "chat",
        username: chatEvent.user.name,
      };

      setEvents((currentEvents) => {
        return [...currentEvents, newEvent].slice(-maxEvents);
      });
    },
    [maxEvents]
  );

  // Handle join events
  const handleJoin = useCallback(
    (joinEvent: {
      id: number;
      user: { name: string; imageUrl: string | null };
    }) => {
      const newEvent: Event = {
        id: joinEvent.id,
        avatar: joinEvent.user.imageUrl,
        content: `${joinEvent.user.name} joined the lobby`,
        type: "join",
        username: joinEvent.user.name,
      };

      setEvents((currentEvents) => {
        return [...currentEvents, newEvent].slice(-maxEvents);
      });
    },
    [maxEvents]
  );

  // Subscribe to real-time events
  useGameEvents({
    gameId,
    enabled: !!gameId,
    onChat: handleChat,
    onJoin: handleJoin,
  });

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
    <div className="w-[377px] max-w-full h-[130px] p-2  px-4 flex flex-col justify-end overflow-hidden">
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
              <Image
                src={event.avatar || "/images/lobby/1.jpg"}
                alt="avatar"
                width={24}
                height={24}
                className="w-6 h-6 rounded-full shrink-0"
              />
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
