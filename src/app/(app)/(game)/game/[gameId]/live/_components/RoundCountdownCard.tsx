"use client";


import { CountdownTimer } from "./CountDownTimer";


import { useEffect } from "react";
import { useSound } from "@/components/providers/SoundContext";
import LiveEventFeed from "../../../_components/LiveEventFeed";
import { Chat } from "../../../_components/chat/Chat";
import { ChatMessage, GameEvent } from "@/hooks/usePartyGame";

export default function RoundCountdownCard({
  duration,
  onComplete,
  gameId,
  nextRoundNumber,
  liveEvents,
  onlineCount,
  chatMessages,
  onSendChat,
}: {
  duration: number;
  onComplete: () => void;
  gameId: number | null;
  nextRoundNumber: number;
  liveEvents: GameEvent["payload"][];
  onlineCount: number;
  chatMessages: ChatMessage[];
  onSendChat: (text: string) => void;
}) {
  const { playSound } = useSound();

  useEffect(() => {
    playSound("roundBreak");
  }, [playSound]);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <CountdownTimer
          duration={duration}
          onComplete={onComplete}
          nextRoundNumber={nextRoundNumber}
        />
        <LiveEventFeed
          maxEvents={5}
          gameId={gameId}
          initialEvents={liveEvents}
        />
      </div>
      <Chat
        gameId={gameId}
        activeCount={onlineCount}
        messages={chatMessages}
        onSendMessage={onSendChat}
      />
    </>
  );
}
