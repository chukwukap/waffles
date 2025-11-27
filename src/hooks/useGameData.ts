import { useState, useEffect, useCallback } from "react";
import { Ticket } from "../../prisma/generated/client";
import { useUser } from "@/hooks/useUser";
import { useMutuals } from "@/hooks/useMutuals";

interface MutualsData {
  mutuals: Array<{ fid: number; pfpUrl: string | null }>;
  mutualCount: number;
  totalCount: number;
}

interface GameUserData {
  ticket: Ticket | null;
  mutuals: MutualsData | null;
  isLoading: boolean;
  isAuthorized: boolean;
}

export function useGameData(
  fid: number | undefined,
  gameId: number | undefined
): GameUserData {
  const { user, isLoading: isUserLoading } = useUser();

  const [ticket, setTicket] = useState<Ticket | null>(null);
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
      const ticketRes = await fetch(
        `/api/user/ticket?fid=${fid}&gameId=${gameId}`
      );

      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        setTicket(ticketData);
      } else {
        // If ticket fetch fails (e.g. 404), it just means no ticket
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
