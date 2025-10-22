"use client";

import { useEffect, useState } from "react";
import { useFinalRoundStore } from "@/stores/finalRoundStore";
import Image from "next/image";

export default function FinalRoundPage() {
  const { pairs, score, timeLeft, status, fetchPairs, submitMatch, reset } =
    useFinalRoundStore();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchPairs();
    return () => reset();
  }, [fetchPairs, reset]);

  const handleMatch = async (choiceId: number, targetId: number) => {
    await submitMatch(choiceId, targetId);
    setCurrent((c) => (c + 1) % pairs.length);
  };

  if (status === "ended") {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen text-white gap-4">
        <h1 className="text-4xl font-bold text-green-400">⏱️ Time’s Up!</h1>
        <p className="text-xl">Final Score: {score}</p>
        <a
          href="/leaderboard"
          className="text-blue-400 underline text-sm hover:text-blue-300"
        >
          View Leaderboard →
        </a>
      </main>
    );
  }

  const pair = pairs[current];
  if (!pair)
    return (
      <main className="flex items-center justify-center min-h-screen text-white">
        <p>Loading images...</p>
      </main>
    );

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 bg-gradient-to-b from-black to-zinc-900 text-white">
      <div className="flex justify-between w-full max-w-md text-gray-400">
        <span>Score: {score}</span>
        <span>{timeLeft}s</span>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div
          className="relative w-40 h-40 cursor-pointer hover:scale-105 transition"
          onClick={() => handleMatch(pair.id, pair.id)}
        >
          <Image
            src={pair.originalUrl}
            alt="original"
            fill
            className="rounded-lg object-cover"
          />
        </div>
        <div
          className="relative w-40 h-40 cursor-pointer hover:scale-105 transition"
          onClick={() => handleMatch(pair.id, pair.id)}
        >
          <Image
            src={pair.generatedUrl}
            alt="generated"
            fill
            className="rounded-lg object-cover"
          />
        </div>
      </div>

      <p className="text-sm text-gray-500">Tap matching pairs fast!</p>
    </main>
  );
}
