import { cache } from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/db";
import type { Game } from "@prisma";
import { minikitConfig } from "@minikit-config";
import { env } from "@/lib/env";

import { GameHub } from "./client";

// ==========================================
// METADATA
// ==========================================

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

// ==========================================
// DATA FETCHING
// ==========================================

/**
 * Fetch current live game or next scheduled game.
 */
const getCurrentOrNextGame = cache(async (): Promise<Game | null> => {
  const now = new Date();

  return prisma.game.findFirst({
    where: {
      OR: [
        { startsAt: { lte: now }, endsAt: { gt: now } },
        { startsAt: { gt: now } },
      ],
    },
    orderBy: [{ startsAt: "asc" }],
  });
});

// ==========================================
// PAGE COMPONENT
// ==========================================

export default async function GamePage() {
  const currentOrNextGame = await getCurrentOrNextGame();

  return <GameHub currentOrNextGame={currentOrNextGame} />;
}

// Force dynamic rendering for real-time data
export const dynamic = "force-dynamic";
