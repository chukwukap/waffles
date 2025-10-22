"use client";

import { useEffect } from "react";
import { useLobbyStore } from "@/stores/lobbyStore";
import { formatCountdown } from "@/lib/time";
import { useAuthStore } from "@/stores/authStore";
import Image from "next/image";

export default function LobbyPage() {
  const { stats, countdown, fetchStats, startCountdown } = useLobbyStore();
  const { fid } = useAuthStore();

  useEffect(() => {
    fetchStats();
    startCountdown(new Date(Date.now() + 10 * 60 * 1000)); // 10-min timer
    const interval = setInterval(fetchStats, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [fetchStats, startCountdown]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <h1 className="text-3xl font-bold text-center">🏁 Waffles Lobby</h1>

      {stats ? (
        <>
          <div className="text-center">
            <p className="text-gray-400">Total Players</p>
            <h2 className="text-4xl font-bold">{stats.totalTickets}</h2>
          </div>

          <div className="text-center">
            <p className="text-gray-400">Prize Pool</p>
            <h2 className="text-3xl text-green-400 font-semibold">
              {stats.totalPrize} USDC
            </h2>
          </div>

          <div className="flex flex-col items-center mt-4">
            <p className="text-gray-400 mb-2">Game starts in:</p>
            <p className="text-5xl font-mono">{countdown}</p>
          </div>

          <div className="mt-8 w-full max-w-md bg-zinc-800 rounded-xl p-4">
            <h3 className="text-xl mb-3 font-semibold">Players in Lobby</h3>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {stats.players.length > 0 ? (
                stats.players.map((player, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-zinc-900 p-2 rounded-lg"
                  >
                    <Image
                      src={player.pfpUrl || "/default-avatar.png"}
                      alt={player.username}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold">{player.username}</span>
                      <span className="text-xs text-gray-500">
                        {player.wallet
                          ? player.wallet.slice(0, 6) +
                            "..." +
                            player.wallet.slice(-4)
                          : "No wallet"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No players yet...</p>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs">
              Game auto-starts when countdown hits 0
            </p>
          </div>
        </>
      ) : (
        <p>Loading lobby data...</p>
      )}
    </main>
  );
}
