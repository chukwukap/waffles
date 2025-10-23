// src/app/(authenticated)/game/page.tsx
// Ensure user has invite code and ticket; otherwise redirect appropriately.

"use client";

import React, { useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import CountdownView from "./_components/CountdownView";
import QuestionView from "./_components/QuestionView";
import LobbyView from "./_components/LobbyView";
import GameOverView from "./_components/GameOverView";
import { useMiniUser } from "@/hooks/useMiniUser";
import { useRouter } from "next/navigation";
import { useLobbyStore } from "@/stores/lobbyStore";

export default function GameScreen() {
  const router = useRouter();
  const gameState = useGameStore((s) => s.gameState);
  const gameId = useGameStore((s) => s.gameId);
  const user = useMiniUser();

  const { referralStatus, ticket } = useLobbyStore();

  // Redirect if missing invite code or ticket
  useEffect(() => {
    if (referralStatus !== "success") {
      router.replace("/lobby/invite-code");
    } else if (!ticket) {
      router.replace("/lobby/buy");
    }
  }, [referralStatus, ticket, router]);

  // Fetch messages if we have a valid game and user
  useEffect(() => {
    if (gameId && user.fid && user.username && user.pfpUrl) {
      useGameStore.getState().fetchMessages(gameId, {
        fid: user.fid,
        username: user.username,
        pfpUrl: user.pfpUrl,
      });
    } else {
      console.error("No user found");
    }
  }, [gameId, user]);

  const view = (() => {
    switch (gameState) {
      case "ROUND_COUNTDOWN":
        return <CountdownView />;
      case "QUESTION_ACTIVE":
      case "ANSWER_SUBMITTED":
        return <QuestionView />;
      case "GAME_OVER":
        return <GameOverView />;
      case "LOBBY":
      default:
        return <LobbyView />;
    }
  })();

  return (
    <div className="w-full min-h-[100dvh] overflow-hidden bg-figmaYay">
      {view}
    </div>
  );
}
