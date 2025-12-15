import { redirect } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { minikitConfig } from "../../../../../minikit.config";

import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: minikitConfig.miniapp.name,
  description: minikitConfig.miniapp.description,
  other: {
    "fc:frame": JSON.stringify({
      version: minikitConfig.miniapp.version,
      imageUrl: minikitConfig.miniapp.heroImageUrl,
      button: {
        title: "Play Waffles",
        action: {
          name: "Play now",
          type: "launch_frame",
          url: `${env.rootUrl}/game`,
          splashImageUrl: minikitConfig.miniapp.splashImageUrl,
          splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
        },
      },
    }),
  },
};

// Find the most relevant game (LIVE > SCHEDULED > ENDED)
const getCurrentGame = cache(async () => {
  // Try LIVE first
  const liveGame = await prisma.game.findFirst({
    where: { status: "LIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (liveGame) return liveGame;

  // Try SCHEDULED
  const scheduledGame = await prisma.game.findFirst({
    where: { status: "SCHEDULED" },
    orderBy: { startsAt: "asc" },
    select: { id: true },
  });
  if (scheduledGame) return scheduledGame;

  // Try most recent ENDED
  const endedGame = await prisma.game.findFirst({
    where: { status: "ENDED" },
    orderBy: { endsAt: "desc" },
    select: { id: true },
  });

  return endedGame;
});

export default async function GameLobbyPage() {
  const game = await getCurrentGame();

  // Redirect to current game if one exists
  if (game) {
    redirect(`/game/${game.id}`);
  }

  // No games available - show empty state
  return (
    <>
      <section className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <p className="text-white/60 font-display text-lg mb-2">
          No games available
        </p>
        <p className="text-white/40 font-display text-sm">
          Check back soon for upcoming trivia games!
        </p>
      </section>

      <BottomNav />
    </>
  );
}

export const revalidate = 3;
