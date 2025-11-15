"use client";

import LiveEventFeed from "@/app/game/_components/LiveEventFeed";
import { CountdownTimer } from "./CountDownTimer";
import { ChatInput } from "@/app/game/_components/chat/ChatTrigger";
import { Chat } from "@/app/game/_components/chat/Chat";
import { useState } from "react";

export default function RoundCountdownCard({
  duration,
  onComplete,
}: {
  duration: number;
  onComplete: () => void;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <CountdownTimer duration={duration} onComplete={onComplete} />
        <LiveEventFeed maxEvents={5} />
      </div>
      <Chat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <ChatInput onOpenChat={() => setChatOpen(true)} />
    </>
  );
}
