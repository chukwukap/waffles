import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { cache } from "react";
import { minikitConfig } from "../../../../../../../../minikit.config";
import { env } from "@/lib/env";
import { buildPrizeOGUrl } from "@/lib/og";
import { redirect } from "next/navigation";

interface SuccessPageProps {
    params: Promise<{ gameId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Cache game data fetch
const getGameInfo = cache(async (gameIdNum: number) => {
    const game = await prisma.game.findUnique({
        where: { id: gameIdNum },
        select: {
            id: true,
            title: true,
            theme: true,
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
    const gameIdNum = Number(gameId);

    // Get game info
    const game = await getGameInfo(gameIdNum);
    if (!game) {
        return { title: "Game Not Found" };
    }

    // Extract share params
    const username = (sParams.username as string) || "Player";
    const prizeAmount = parseInt((sParams.prizeAmount as string) || "0", 10);
    const pfpUrl = sParams.pfpUrl as string | undefined;

    // Build OG image URL using the /api/og/prize route
    const imageUrl = buildPrizeOGUrl({
        username,
        prizeAmount,
        pfpUrl,
    });

    console.log(imageUrl)
    return {
        title: `${username} won on Waffles!`,
        description: `${username} just won $${prizeAmount.toLocaleString()} on Waffles!`,
        openGraph: {
            title: `${username} won on Waffles!`,
            description: `Won $${prizeAmount.toLocaleString()} on Waffles!`,
            images: imageUrl ? [imageUrl] : [],
        },
        other: {
            "fc:frame": JSON.stringify({
                version: minikitConfig.miniapp.version,
                imageUrl: imageUrl || minikitConfig.miniapp.heroImageUrl,
                button: {
                    title: "Join the next game ➡️🔥",
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

export default async function ResultSuccessPage({
    params,
}: SuccessPageProps) {
    const { gameId } = await params;
    const gameIdNum = Number(gameId);

    // This page is just for metadata generation (Farcaster frame preview)
    // Redirect to the actual result page
    redirect(`/game/${gameIdNum}/result`);
}
