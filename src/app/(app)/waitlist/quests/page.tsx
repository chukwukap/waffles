import { Metadata } from "next";
import { QuestsPageClient } from "./client";
import { minikitConfig } from "@minikit-config";
import { env } from "@/lib/env";

// ==========================================
// METADATA - Farcaster Frame for notifications
// ==========================================

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Quests | ${minikitConfig.miniapp.name}`,
        description: "Complete quests to earn points and climb the waitlist!",
        other: {
            "fc:frame": JSON.stringify({
                version: minikitConfig.miniapp.version,
                imageUrl: minikitConfig.miniapp.heroImageUrl,
                button: {
                    title: "View Quests 🎯",
                    action: {
                        name: "View Quests",
                        type: "launch_frame",
                        url: `${env.rootUrl}/waitlist/quests`,
                        splashImageUrl: minikitConfig.miniapp.splashImageUrl,
                        splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
                    },
                },
            }),
        },
    };
}

// ==========================================
// PAGE COMPONENT
// ==========================================

export default function QuestsPage() {
    return <QuestsPageClient />;
}
