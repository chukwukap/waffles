import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { cache } from "react";
import { minikitConfig } from "@minikit-config";
import { env } from "@/lib/env";
import { buildJoinedOGUrl } from "@/lib/og";
import { TicketSuccessClient } from "./client";

interface SuccessPageProps {
    params: Promise<{ gameId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Cache game data fetch
const getGameInfo = cache(async (gameId: string) => {
    const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: {
            id: true,
            title: true,
            theme: true,
            coverUrl: true,
            prizePool: true,
            startsAt: true,
            endsAt: true,
        },
    });
    return game;
});

export async function generateMetadata({
    params,
    searchParams,
}: SuccessPageProps): Promise<Metadata> {
    const { gameId } = await params;
    const sParams = await searchParams;

    // Get game info
    const game = await getGameInfo(gameId);
    if (!game) {
        return { title: "Game Not Found" };
    }

    // Extract share params
    const username = (sParams.username as string) || "Player";
    const pfpUrl = sParams.pfpUrl as string | undefined;
    // themeImageUrl must be absolute URL for OG image generator to fetch
    const themeImageUrl = game.coverUrl
        ? (game.coverUrl.startsWith("http") ? game.coverUrl : `${env.rootUrl}${game.coverUrl}`)
        : `${env.rootUrl}/logo.png`;

    // Build OG image URL using the /api/og/joined route
    const imageUrl = buildJoinedOGUrl({
        username,
        prizePool: game.prizePool,
        theme: game.theme,
        pfpUrl,
        themeImageUrl,
    });

    return {
        title: `${username} joined Waffles!`,
        description: `${username} just joined the next Waffles game! Theme: ${game.theme}, Prize Pool: $${game.prizePool.toLocaleString()}`,
        openGraph: {
            title: `${username} joined Waffles!`,
            description: `Theme: ${game.theme} | Current Prize Pool: $${game.prizePool.toLocaleString()}`,
            images: imageUrl ? [imageUrl] : [],
        },
        other: {
            "fc:frame": JSON.stringify({
                version: minikitConfig.miniapp.version,
                imageUrl: imageUrl || minikitConfig.miniapp.heroImageUrl,
                button: {
                    title: "Play Waffles 🔥",
                    action: {
                        name: "Play Waffles",
                        type: "launch_frame",
                        url: `${env.rootUrl}/game`,
                        splashImageUrl: minikitConfig.miniapp.splashImageUrl,
                        splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
                    },
                },
            }),
        },
    };
}

export default async function TicketSuccessPage({
    params,
    searchParams,
}: SuccessPageProps) {
    const { gameId } = await params;
    const sParams = await searchParams;

    const game = await getGameInfo(gameId);
    if (!game) {
        throw new Error("Game not found");
    }

    // Extract params for client
    const ticketCode = (sParams.ticketCode as string) || undefined;

    return (
        <TicketSuccessClient
            gameId={game.id}
            theme={game.theme}
            coverUrl={game.coverUrl || ""}
            prizePool={game.prizePool}
            startsAt={game.startsAt.toISOString()}
            endsAt={game.endsAt.toISOString()}
            ticketCode={ticketCode}
        />
    );
}
