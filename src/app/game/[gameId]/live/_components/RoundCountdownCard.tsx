"use client";

import LiveEventFeed from "@/app/game/_components/LiveEventFeed";
import { CountdownTimer } from "./CountDownTimer";
import { ChatInput } from "@/app/game/_components/chat/ChatTrigger";
import { Chat } from "@/app/game/_components/chat/Chat";
import { useEffect, useState } from "react";
import { useSound } from "@/components/providers/SoundContext";

export default function RoundCountdownCard({
  duration,
  onComplete,
  gameId,
}: {
  duration: number;
  onComplete: () => void;
  gameId: number | null;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const { playSound } = useSound();

  useEffect(() => {
    playSound("roundBreak");
  }, [playSound]);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <CountdownTimer duration={duration} onComplete={onComplete} />
        <LiveEventFeed maxEvents={5} gameId={gameId} />
      </div>
      <Chat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        gameId={gameId}
      />
      <ChatInput onOpenChat={() => setChatOpen(true)} />
    </>
  );
}
