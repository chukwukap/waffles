"use client";
import { memo } from "react";
import { useGameStore, selectEvents, selectMessages } from "@/lib/game-store";
import type { GameEvent, ChatMessage } from "@/lib/game-store";

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
  opacity,
}: {
  item: FeedItem;
  opacity: number;
}) {
  return (
    <div
      style={{ opacity }}
      className="flex items-center gap-2"
    >
      {/* Avatar */}
      {item.pfpUrl ? (
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

      <span className={`text-white/70 text-sm truncate ${item.type === "event" ? "italic" : ""}`}>
        <span className="text-white font-medium">{item.username}</span>{" "}
        <span className="font-display">
          {item.content}
        </span>
      </span>
    </div>
  );
});

// ==========================================
// MAIN COMPONENT
// ==========================================

interface LiveEventFeedProps {
  maxEvents?: number;
}

export function LiveEventFeed({ maxEvents = 5 }: LiveEventFeedProps) {
  const events = useGameStore(selectEvents);
  const messages = useGameStore(selectMessages);

  // Combine events and recent chat messages into a unified feed
  const feedItems: FeedItem[] = [
    ...events.map((e): FeedItem => ({
      id: e.id,
      type: "event",
      username: e.username,
      pfpUrl: e.pfpUrl,
      content: e.content,
      timestamp: e.timestamp,
    })),
    ...messages.map((m): FeedItem => ({
      id: m.id,
      type: "chat",
      username: m.username,
      pfpUrl: m.pfpUrl,
      content: m.text,
      timestamp: m.timestamp,
    })),
  ];

  // Sort by timestamp and take most recent
  const sortedItems = feedItems
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-maxEvents);

  // Calculate opacity based on position (newer = more visible)
  const getOpacity = (index: number) => {
    const positionFromEnd = sortedItems.length - 1 - index;
    if (positionFromEnd === 0) return 1.0;
    if (positionFromEnd === 1) return 0.7;
    if (positionFromEnd === 2) return 0.4;
    if (positionFromEnd === 3) return 0.2;
    return 0.1;
  };

  if (sortedItems.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-[377px] h-[130px] p-2 px-4 flex flex-col justify-end overflow-hidden">
      <div className="flex flex-col gap-2 pt-4">
        {sortedItems.map((item, index) => (
          <FeedItemRow
            key={item.id}
            item={item}
            opacity={getOpacity(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default LiveEventFeed;

