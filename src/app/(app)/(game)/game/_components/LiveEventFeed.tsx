"use client";

import { memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/components/providers/GameStoreProvider";
import { selectEvents, selectMessages, selectIsConnected, selectOnlineCount, type GameEvent, type ChatMessage } from "@/lib/game-store";
import { springs } from "@/lib/animations";

// ==========================================
// TYPES
// ==========================================

interface FeedItem {
  id: string;
  type: "event" | "chat";
  username: string;
  pfpUrl: string | null;
  content: string;
  timestamp: number;
}

// ==========================================
// FEED ITEM COMPONENT
// ==========================================

const FeedItemRow = memo(function FeedItemRow({
  item,
  isNew,
}: {
  item: FeedItem;
  isNew?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, x: -20, scale: 0.95 } : false}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      transition={springs.snappy}
      className="flex items-center gap-2"
    >
      {/* Avatar with pop-in effect */}
      <motion.div
        initial={isNew ? { scale: 0 } : false}
        animate={{ scale: 1 }}
        transition={{ ...springs.bouncy, delay: 0.1 }}
      >
        {item.pfpUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.pfpUrl}
            alt={item.username}

            className="w-5 h-5 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-white/20 shrink-0 flex items-center justify-center">
            <span className="text-[10px] text-white/80">
              {item.username?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}
      </motion.div>

      {/* Message content */}
      <span
        className={`text-white/70 text-sm truncate ${item.type === "event" ? "italic" : ""
          }`}
      >
        <span className="text-white font-medium">{item.username}</span>{" "}
        <span className="font-display">{item.content}</span>
      </span>

      {/* New message indicator dot */}
      {/* {isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.3 }}
          className="w-1.5 h-1.5 rounded-full bg-[#F5BB1B] shrink-0"
        />
      )} */}
    </motion.div>
  );
});

// ==========================================
// CONNECTION INDICATOR
// ==========================================

function ConnectionIndicator({ isConnected, onlineCount }: { isConnected: boolean; onlineCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-2 right-4 flex items-center gap-1.5 z-20"
    >
      {/* Status dot */}
      <motion.div
        animate={
          isConnected
            ? { scale: [1, 1.2, 1], opacity: 1 }
            : { scale: [0.8, 1, 0.8], opacity: [0.5, 1, 0.5] }
        }
        transition={{ duration: isConnected ? 2 : 1, repeat: Infinity }}
        className={`w-2 h-2 rounded-full ${isConnected ? "bg-[#14B985]" : "bg-[#F5BB1B]"}`}
      />
      {/* Status text */}
      <span className="text-[10px] text-white/50 font-display">
        {isConnected ? `${onlineCount} online` : "connecting..."}
      </span>
    </motion.div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

interface LiveEventFeedProps {
  maxEvents?: number;
}

export function LiveEventFeed({ maxEvents = 5 }: LiveEventFeedProps) {
  const events = useGameStore(selectEvents);
  const messages = useGameStore(selectMessages);
  const isConnected = useGameStore(selectIsConnected);
  const onlineCount = useGameStore(selectOnlineCount);
  const addEvent = useGameStore((s) => s.addEvent);

  // Note: Welcome message removed - feed starts empty until real events arrive

  // Combine events and recent chat messages into a unified feed
  const feedItems: FeedItem[] = [
    ...events.map(
      (e): FeedItem => ({
        id: e.id,
        type: "event",
        username: e.username,
        pfpUrl: e.pfpUrl,
        content: e.content,
        timestamp: e.timestamp,
      })
    ),
    ...messages.map(
      (m): FeedItem => ({
        id: m.id,
        type: "chat",
        username: m.username,
        pfpUrl: m.pfpUrl,
        content: m.text,
        timestamp: m.timestamp,
      })
    ),
  ];

  // Sort by timestamp and take most recent
  const sortedItems = feedItems
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-maxEvents);

  // Check if item is the newest (for special animation)
  const isNewest = (index: number) => index === sortedItems.length - 1;

  if (sortedItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full max-w-full mx-auto flex flex-col justify-center items-center"
        style={{ height: "clamp(60px, 12vh, 140px)" }}
      >
        <ConnectionIndicator isConnected={isConnected} onlineCount={onlineCount} />
        <motion.p
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/30 text-sm font-display"
        >
          Waiting for activity...
        </motion.p>
      </motion.div>
    );
  }

  return (
    <div
      className="relative w-screen -mx-4 overflow-hidden"
      style={{ height: "clamp(60px, 12vh, 140px)" }}
    >
      {/* Connection status indicator */}
      <ConnectionIndicator isConnected={isConnected} onlineCount={onlineCount} />
      {/* Content layer with mask for smooth fade */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.gentle}
        className="absolute inset-0 py-2 px-4 flex flex-col justify-end overflow-hidden"
        style={{
          maskImage: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 15%, rgba(0,0,0,0.8) 35%, black 55%)`,
          WebkitMaskImage: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 15%, rgba(0,0,0,0.8) 35%, black 55%)`,
        }}
      >
        <div className="flex flex-col gap-1 pt-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {sortedItems.map((item, index) => (
              <FeedItemRow key={item.id} item={item} isNew={isNewest(index)} />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default LiveEventFeed;
