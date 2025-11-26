import { useState, useEffect, useCallback } from "react";
import { Ticket } from "../../prisma/generated/client";
import { useUser } from "@/hooks/useUser";

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
  const [mutuals, setMutuals] = useState<MutualsData | null>(null);
  const [isFetchingGameData, setIsFetchingGameData] = useState(true);

  const fetchGameSpecificData = useCallback(async () => {
    if (!fid || !gameId) {
      setIsFetchingGameData(false);
      return;
    }

    setIsFetchingGameData(true);

    try {
      // Fetch both in parallel for better performance
      const [mutualsRes, ticketRes] = await Promise.all([
        fetch(`/api/mutuals?fid=${fid}&gameId=${gameId}&context=game`),
        fetch(`/api/user/ticket?fid=${fid}&gameId=${gameId}`),
      ]);

      if (mutualsRes.ok) {
        const mutualsData = await mutualsRes.json();
        setMutuals(mutualsData);
      }

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
