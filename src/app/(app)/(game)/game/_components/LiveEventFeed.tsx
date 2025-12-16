"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, selectEvents } from "@/lib/game-store";
import type { GameEvent } from "@/lib/game-store";

// ==========================================
// EVENT ITEM
// ==========================================

const EventItem = memo(function EventItem({ event }: { event: GameEvent }) {
  const getIcon = () => {
    switch (event.type) {
      case "join":
        return "👋";
      case "answer":
        return "✨";
      case "achievement":
        return "🏆";
      default:
        return "💫";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-2 py-1.5 px-3 bg-white/5 rounded-lg"
    >
      <span className="text-sm">{getIcon()}</span>
      <span className="text-white/70 text-sm">
        <span className="text-white font-medium">{event.username}</span>{" "}
        {event.content}
      </span>
    </motion.div>
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

  // Show only the most recent events
  const visibleEvents = events.slice(-maxEvents);

  if (visibleEvents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-white/50 font-display text-xs uppercase tracking-wider">
        Live Activity
      </h3>
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {visibleEvents.map((event: GameEvent) => (
            <EventItem key={event.id} event={event} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
