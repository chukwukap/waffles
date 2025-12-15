"use client";

import { createGameAction } from "@/actions/admin/games";
import { GameForm } from "@/components/admin/GameForm";
import Link from "next/link";
import { ArrowLeftIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

export default function CreateGamePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Enhanced Header */}
      <div className="relative">
        {/* Background glow effect */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#FFC931]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 right-0 w-40 h-40 bg-[#00CFF2]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              href="/admin/games"
              className="mt-1 p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-linear-to-br from-[#FFC931] to-[#00CFF2] shadow-lg shadow-[#FFC931]/20">
                  <RocketLaunchIcon className="h-6 w-6 text-black" />
                </div>
                <h1 className="text-3xl font-bold text-white font-display">
                  Create New Game
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Form */}
      <GameForm action={createGameAction} />
    </div>
  );
}
