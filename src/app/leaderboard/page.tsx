"use client";

import { useEffect } from "react";
import { useLeaderboardStore } from "@/stores/leaderboardStore";
import { useAuthStore } from "@/stores/authStore";
import { shareResult } from "@/lib/share";
import Image from "next/image";

export default function LeaderboardPage() {
  const { entries, me, fetchLeaderboard } = useLeaderboardStore();
  const { fid, username } = useAuthStore();

  useEffect(() => {
    if (fid) fetchLeaderboard(1, fid);
  }, [fetchLeaderboard, fid]);

  if (!entries.length)
    return (
      <main className="flex items-center justify-center min-h-screen text-white">
        <p>Loading leaderboard...</p>
      </main>
    );

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white gap-6 p-6">
      <h1 className="text-3xl font-bold">🏆 Waffles Leaderboard</h1>

      <div className="flex items-end justify-center gap-6 mt-4">
        {podium.map((p, i) => (
          <div
            key={p.rank}
            className={`flex flex-col items-center ${
              i === 1 ? "order-1" : i === 0 ? "order-2" : "order-3"
            }`}
          >
            <Image
              src={p.pfpUrl || "/default-avatar.png"}
              alt={p.username}
              width={80}
              height={80}
              className={`rounded-full border-4 ${
                i === 0
                  ? "border-yellow-400"
                  : i === 1
                  ? "border-gray-400"
                  : "border-amber-600"
              }`}
            />
            <span className="text-lg font-bold mt-2">{p.username}</span>
            <span className="text-sm text-gray-400">{p.points} pts</span>
            <span className="text-xl font-bold mt-2">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
            </span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-md mt-8">
        <h2 className="text-xl mb-2 font-semibold">Top 20 Players</h2>
        <div className="space-y-2">
          {rest.map((p) => (
            <div
              key={p.rank}
              className="flex justify-between bg-zinc-800 p-2 rounded-lg"
            >
              <span>
                #{p.rank} {p.username}
              </span>
              <span>{p.points}</span>
            </div>
          ))}
        </div>
      </div>

      {me && (
        <div className="mt-6 text-center">
          <p className="text-gray-300">
            You’re <b>#{me.rank}</b> with <b>{me.points}</b> points
          </p>
          <button
            onClick={() => shareResult(fid!, me.rank!, me.points!)}
            className="mt-3 bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Share on Farcaster
          </button>
        </div>
      )}

      <footer className="text-gray-500 text-xs mt-10">
        <p>🏁 Next tournament starts soon. Stay tuned.</p>
      </footer>
    </main>
  );
}
