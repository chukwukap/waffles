// ───────────────────────── src/app/lobby/page.tsx ─────────────────────────
"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useLobbyStore } from "@/stores/lobbyStore";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { SpotsLeft } from "./buy/_components/SpotsLeft";
import { useRouter } from "next/navigation";
import LogoIcon from "@/components/logo/LogoIcon";
import { cn } from "@/lib/utils";
import { WalletIcon } from "@/components/icons";
import { BottomNav } from "@/components/BottomNav";

// ───────────────────────── COMPONENT ─────────────────────────
export default function LobbyPage() {
  const router = useRouter();
  const { stats, countdown, fetchStats, startCountdown, stopCountdown } =
    useLobbyStore();

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
    // Mock game start: 5 minutes from now
    const startTime = new Date(Date.now() + 5 * 60 * 1000);
    startCountdown(startTime);

    return () => stopCountdown();
  }, [fetchStats, startCountdown, stopCountdown]);

  return (
    <div className="h-screen flex flex-col bg-figma noise relative font-body">
      {/* HEADER */}
      <div
        className={cn(
          "p-4 flex items-center justify-between border-b border-border bg-figma"
        )}
      >
        <LogoIcon />
        <div className="flex items-center gap-1.5 bg-figma rounded-full px-3 py-1.5">
          <WalletIcon className="w-4 h-4 text-foreground" />
          <span className="text-xs text-foreground">$983.23</span>
        </div>
      </div>

      {/* MAIN */}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        {/* Title */}
        <h1 className="text-3xl font-bold uppercase tracking-wide">
          GAME LOBBY
        </h1>

        {/* Countdown */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm text-muted">Next round starts in</span>
          <span className="text-5xl font-display tracking-tight text-[#00CFF2]">
            {countdown}
          </span>
        </div>

        {/* Prize Pool */}
        <div className="flex flex-col items-center">
          <span className="text-[13px] text-muted uppercase tracking-wide">
            Total Prize Pool
          </span>
          <span className="text-3xl font-display text-white">
            ${stats?.totalPrize ?? "0"}
          </span>
        </div>

        {/* Players */}
        <SpotsLeft
          current={stats?.totalTickets ?? 0}
          total={300}
          avatars={(stats?.players ?? [])
            .slice(0, 4)
            .map((p) => p.pfpUrl || "/images/avatars/a.png")}
        />

        {/* CTA */}
        <div className="mt-8 w-full max-w-[300px] px-4">
          <FancyBorderButton onClick={() => router.push("/game")}>
            ENTER GAME
          </FancyBorderButton>
        </div>

        {/* Leaderboard Preview */}
        <div className="mt-8 w-full max-w-sm">
          <h3 className="text-lg font-semibold mb-3 text-white/80">
            Top Players
          </h3>
          <ul className="flex flex-col gap-2 items-center">
            {(stats?.players ?? []).slice(0, 5).map((p, i) => (
              <li
                key={i}
                className="flex items-center justify-between w-full bg-white/5 rounded-lg px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={p.pfpUrl || "/images/avatars/a.png"}
                    alt={p.username || "player"}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                  <span className="text-white text-sm">{p.username}</span>
                </div>
                <span className="text-xs text-[#00CFF2] uppercase font-semibold">
                  Joined
                </span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
