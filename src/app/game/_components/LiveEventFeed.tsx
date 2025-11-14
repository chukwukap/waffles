import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type EventType = "join" | "chat";

// --- Mock Data ---
// In a real app, this data would come from your backend/websocket
const mockUsernames = [
  "uxpotato",
  "delfin0x",
  "cyberverse.eth",
  "ninja",
  "reactdev",
];
const mockEventContents = [
  "is this thing working",
  "joined the lobby",
  "readyyyyy",
  "LFG!",
  "hello world",
  "gm",
];
const mockAvatars = [
  "/images/lobby/1.jpg", // uxpotato
  "/images/lobby/2.jpg", // delfin0x
  "/images/lobby/3.jpg", // cyberverse.eth
  "/images/lobby/4.jpg", // ninja
  "/images/lobby/5.jpg", // reactdev
];

interface Event {
  id: number;
  avatar: string;
  content: string;
  type: EventType;
  username: string;
}

let eventId = 0;

const createMockEvent = (): Event => {
  const userIndex = Math.floor(Math.random() * mockUsernames.length);
  const content =
    Math.random() > 0.3
      ? mockEventContents[Math.floor(Math.random() * mockEventContents.length)]
      : "joined the lobby";

  if (content === "joined the lobby") {
    return {
      id: eventId++,
      avatar: mockAvatars[userIndex],
      content: `${mockUsernames[userIndex]} joined the lobby`,
      type: "join",
      username: mockUsernames[userIndex],
    };
  } else {
    return {
      id: eventId++,
      avatar: mockAvatars[userIndex],
      content: content,
      type: "chat",
      username: mockUsernames[userIndex],
    };
  }
};

// --- LiveEventFeed Component ---
// This is the component you requested.
// It shows the last `maxEvents` and fades them out.
export default function LiveEventFeed({
  maxEvents = 5,
}: {
  maxEvents: number;
}) {
  const [events, setEvents] = useState<Event[]>([]);

  // Simulate receiving new events every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((currentEvents) => {
        const newEvent = createMockEvent();
        // Add new event and keep only the last `maxEvents`
        return [...currentEvents, newEvent].slice(-maxEvents);
      });
    }, 2500); // New event every 2.5s

    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, [maxEvents]);

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
                src={event.avatar}
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
