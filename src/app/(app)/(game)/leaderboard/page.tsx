import { Metadata } from "next";
import { minikitConfig } from "@minikit-config";
import { env } from "@/lib/env";

import { BottomNav } from "@/components/BottomNav";
import LeaderboardClient from "./client";

// ==========================================
// METADATA
// ==========================================
export const metadata: Metadata = {
  title: `Leaderboard | ${minikitConfig.miniapp.name}`,
  description: "See who's winning! Top players ranked by score.",
  other: {
    "fc:frame": JSON.stringify({
      version: minikitConfig.miniapp.version,
      imageUrl: minikitConfig.miniapp.heroImageUrl,
      button: {
        title: "View Leaderboard",
        action: {
          name: "View Leaderboard",
          type: "launch_frame",
          url: `${env.rootUrl}/leaderboard`,
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
export default function LeaderboardPage() {
  return (
    <>
      <LeaderboardClient />
      <BottomNav />
    </>
  );
}
