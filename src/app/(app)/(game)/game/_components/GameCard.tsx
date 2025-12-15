"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { calculatePrizePool } from "@/lib/utils";
import type { LobbyGame } from "../page";

interface GameCardProps {
  game: LobbyGame;
  featured?: boolean;
}

// Theme icons mapping
const themeIcons: Record<string, string> = {
  GENERAL: "🎯",
  SPORTS: "⚽",
  MUSIC: "🎵",
  MOVIES: "🎬",
  SCIENCE: "🔬",
  HISTORY: "📜",
  GEOGRAPHY: "🌍",
  FOOD: "🍕",
  GAMING: "🎮",
  CRYPTO: "₿",
};

function formatCountdown(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "Starting...";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function GameCard({ game, featured = false }: GameCardProps) {
  const isLive = game.status === "LIVE";
  const isEnded = game.status === "ENDED";
  const isScheduled = game.status === "SCHEDULED";

  const prizePool = calculatePrizePool({
    ticketsNum: game._count.tickets,
    ticketPrice: game.entryFee,
    additionPrizePool: game.prizePool,
  });

  const formattedPrize = prizePool.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const themeIcon = themeIcons[game.theme] ?? "🎯";

  return (
    <Link href={`/game/${game.id}`}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={`relative rounded-2xl border p-4 transition-colors ${
          featured
            ? "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30"
            : isEnded
            ? "bg-white/3 border-white/10 opacity-70"
            : "bg-white/5 border-white/10"
        }`}
      >
        {/* Live indicator */}
        {isLive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/40">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-display text-xs uppercase">
              Live
            </span>
          </div>
        )}

        {/* Header: Theme + Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
            {themeIcon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-body text-lg leading-tight truncate">
              {game.title}
            </h3>
            <p className="text-white/50 font-display text-xs uppercase">
              {game.theme}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between">
          {/* Prize Pool */}
          <div>
            <p className="text-amber-400 font-body text-xl">${formattedPrize}</p>
            <p className="text-white/40 font-display text-xs">Prize Pool</p>
          </div>

          {/* Players */}
          <div className="text-center">
            <p className="text-white font-body text-lg">
              {game._count.players}
            </p>
            <p className="text-white/40 font-display text-xs">Players</p>
          </div>

          {/* Status / Time */}
          <div className="text-right">
            {isScheduled && (
              <>
                <p className="text-cyan-400 font-body text-lg">
                  {formatCountdown(game.startsAt)}
                </p>
                <p className="text-white/40 font-display text-xs">Starts in</p>
              </>
            )}
            {isLive && (
              <>
                <p className="text-green-400 font-body text-lg">NOW</p>
                <p className="text-white/40 font-display text-xs">Playing</p>
              </>
            )}
            {isEnded && (
              <>
                <p className="text-white/50 font-body text-sm">
                  {formatDate(game.endsAt)}
                </p>
                <p className="text-white/40 font-display text-xs">Ended</p>
              </>
            )}
          </div>
        </div>

        {/* Entry Fee Badge */}
        {!isEnded && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-white/50 font-display text-xs">
              Entry: ${game.entryFee.toFixed(2)} USDC
            </span>
            <span className="text-cyan-400 font-display text-xs uppercase">
              {isLive ? "Join Now →" : "View Details →"}
            </span>
          </div>
        )}
      </motion.div>
    </Link>
  );
}

