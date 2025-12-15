import { useState, useEffect, useCallback } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useMutuals } from "@/hooks/useMutuals";

interface MutualsData {
  mutuals: Array<{ fid: number; pfpUrl: string | null }>;
  mutualCount: number;
  totalCount: number;
}

interface TicketData {
  id: number;
  code: string;
  status: string;
  amountUSDC: number;
  gameId: number;
  purchasedAt: string;
  redeemedAt: string | null;
}

/**
 * Hook to fetch game-specific user data (ticket + mutuals).
 * Auth is handled by GameAuthGate in layout.
 */
export function useGameData(fid: number | undefined, gameId: number | undefined) {
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mutuals = useMutuals({ context: "game", gameId, limit: 25 });

  const fetchTicket = useCallback(async () => {
    if (!fid || !gameId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await sdk.quickAuth.fetch(`/api/v1/me/tickets?gameId=${gameId}`);
      if (res.ok) {
        const tickets: TicketData[] = await res.json();
        setTicket(tickets[0] || null);
      }
    } catch (err) {
      console.error("Error fetching ticket:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fid, gameId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  return { ticket, mutuals, isLoading };
}
