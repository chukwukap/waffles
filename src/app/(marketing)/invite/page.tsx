import InvitePageClient from "./client";
import { minikitConfig } from "../../../../minikit.config";
import { env } from "@/lib/env";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: minikitConfig.miniapp.name,
    description: `You're invited to join the waitlist.`,
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: `${env.rootUrl}/api/og/invite`,
        button: {
          title: `Open app`,
          action: {
            name: `Open app`,
            type: "launch_frame",
            url: `${env.rootUrl}/invite`,
            splashImageUrl: minikitConfig.miniapp.splashImageUrl,
            splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
          },
        },
      }),
    },
  };
}

export default function InvitePage() {
  return <InvitePageClient />;
}
