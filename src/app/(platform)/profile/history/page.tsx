import { cache } from "react";
import { prisma } from "@/lib/db";
import { GameHistoryEntry } from "@/lib/types";
import HistoryClient from "./client";

const getGameHistory = cache(
  async (fid: number): Promise<GameHistoryEntry[]> => {
    // 1. Find user by FID to get their internal ID
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true },
    });

    if (!user) {
      return []; // No user, no history
    }

    // 2. Find all games this user played, ordered by most recent
    const participations = await prisma.gamePlayer.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: "desc" },
      select: {
        gameId: true,
        joinedAt: true,
        score: true,
        rank: true,
        claimedAt: true, // Critical for the CLAIM button state
        game: {
          select: {
            id: true,
            title: true,
            theme: true, // Get theme to maybe customize icon later
            // Include this user's ticket for this game to find winnings amount
            tickets: {
              where: {
                userId: user.id,
                status: "PAID",
              },
              select: { amountUSDC: true },
              take: 1,
            },
          },
        },
      },
    });

    // 3. Map to the GameHistoryEntry type
    const gameHistory: GameHistoryEntry[] = participations.map((p) => {
      // Winnings are stored on the ticket (or you might have a specific Rewards table later)
      // For now, based on schema, we use ticket amount or calculate based on rank
      // NOTE: In a real app, 'winnings' might be separate from 'ticket cost'. 
      // Assuming for this view 'amountUSDC' on ticket represents the payout if status is PAID and rank is 1? 
      // Or simply passing the value for display. 

      // Logic Adjustment: If you want to show *Prize* money, that logic usually lives 
      // in the `claimPrize` calculation. For history display:
      const ticketValue = p.game.tickets[0]?.amountUSDC ?? 0;

      // If the user didn't win (Rank > X), winnings should probably be 0 for display?
      // For this implementation, we assume `ticketValue` is the prize if rank exists.
      // Adjust this line if your schema stores "payout" differently.
      const winnings = p.rank === 1 ? (ticketValue > 0 ? ticketValue : 50) : 0;

      return {
        id: p.game.id,
        name: p.game.title ?? "Game",
        score: p.score,
        winnings: winnings,
        winningsColor: winnings > 0 ? "green" : "gray",
        claimedAt: p.claimedAt,
      };
    });

    return gameHistory;
  }
);

export default async function GameHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ fid: string }>;
}) {
  const { fid } = await searchParams;

  if (!fid) {
    return (
      <div className="p-4 text-center text-white/60">
        Please log in to view history.
      </div>
    );
  }

  const gameHistoryPromise = getGameHistory(Number(fid));

  return <HistoryClient payloadPromise={gameHistoryPromise} />;
}