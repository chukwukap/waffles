"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useGameStore } from "@/stores/gameStore";

/**
 * Ensures user flow stays consistent:
 * - skips invite if already entered
 * - skips buy if ticket exists
 * - skips lobby if ready to play
 */
export function useFlowRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  const { referralCode, referralStatus, ticket, purchaseStatus } =
    useLobbyStore();

  const { gameState } = useGameStore();

  useEffect(() => {
    // wait until store is hydrated
    if (referralStatus === "idle") return;

    const hasInvite = referralCode && referralStatus === "success";
    const hasTicket = !!ticket;
    const isConfirmed = purchaseStatus === "confirmed";

    if (!hasInvite && pathname !== "/lobby/invite-code") {
      router.replace("/lobby/invite-code");
      return;
    }

    if (hasInvite && !hasTicket && pathname !== "/lobby/buy") {
      router.replace("/lobby/buy");
      return;
    }

    if (hasTicket && !isConfirmed && pathname !== "/lobby/confirm") {
      router.replace("/lobby/confirm");
      return;
    }

    if (hasInvite && hasTicket && isConfirmed) {
      // if in lobby pages but user already ready
      if (pathname.startsWith("/lobby")) {
        router.replace("/game");
      }
      return;
    }

    // if game already in progress, always go to /game
    if (gameState && gameState !== "LOBBY" && pathname !== "/game") {
      router.replace("/game");
    }
  }, [
    router,
    pathname,
    referralCode,
    referralStatus,
    ticket,
    purchaseStatus,
    gameState,
  ]);
}
