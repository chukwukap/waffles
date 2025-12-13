import { useState, useEffect, useCallback } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useUser } from "@/hooks/useUser";
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

interface GameUserData {
  ticket: TicketData | null;
  mutuals: MutualsData | null;
  isLoading: boolean;
  isAuthorized: boolean;
}

export function useGameData(
  fid: number | undefined,
  gameId: number | undefined
): GameUserData {
  const { user, isLoading: isUserLoading } = useUser();

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isFetchingGameData, setIsFetchingGameData] = useState(true);

  // Use the hook for mutuals, requesting enough for the avatar diamond (25)
  const mutuals = useMutuals({
    context: "game",
    gameId,
    limit: 25,
  });

  const fetchGameSpecificData = useCallback(async () => {
    if (!fid || !gameId) {
      setIsFetchingGameData(false);
      return;
    }

    setIsFetchingGameData(true);

    try {
      // Use authenticated fetch to get tickets for this game
      const ticketRes = await sdk.quickAuth.fetch(
        `/api/v1/me/tickets?gameId=${gameId}`
      );

      if (ticketRes.ok) {
        const tickets: TicketData[] = await ticketRes.json();
        // Get the first ticket for this game (should be only one per user per game)
        setTicket(tickets[0] || null);
      } else {
        setTicket(null);
      }
    } catch (err) {
      console.error("Error fetching game data:", err);
    } finally {
      setIsFetchingGameData(false);
    }
  }, [fid, gameId]);

  useEffect(() => {
    fetchGameSpecificData();
  }, [fetchGameSpecificData]);

  const isAuthorized = !isUserLoading && user?.status === "ACTIVE";
  const isLoading = isUserLoading || isFetchingGameData;

  return {
    ticket,
    mutuals,
    isLoading,
    isAuthorized,
  };
}
