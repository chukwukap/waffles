import { Metadata } from "next";
import { minikitConfig } from "@minikit-config";
import { env } from "@/lib/env";
import { getCurrentOrNextGame } from "@/lib/game";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";
import { BottomNav } from "@/components/BottomNav";

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
// PAGE COMPONENT
// ==========================================

export default async function GamePage() {
  // Fetch game data in server component
  const { game } = await getCurrentOrNextGame();

  return (
    <RealtimeProvider
      gameId={game?.id ?? null}
    >
      <GameHub game={game} />
      <BottomNav />
    </RealtimeProvider>
  );
}
