"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { SubHeader } from "@/components/ui/SubHeader";
import GameDetailsClient from "./client";

// Define the precise payload needed for the client
export type GameDetailsPayload = {
    gameId: number;
    gameTitle: string;
    gameTheme: string;
    playerScore: number;
    playerRank: number;
    playerWinnings: number;
    claimedAt: Date | null;
    userInfo: {
        username: string;
        pfpUrl: string;
    };
};

/**
 * Fetches all necessary data for the Game Details screen.
 */
const getGameDetails = cache(
    async (gameId: number, fid: number): Promise<GameDetailsPayload | null> => {
        if (isNaN(gameId) || isNaN(fid)) return null;

        // 1. Find User to get internal ID
        const user = await prisma.user.findUnique({
            where: { fid },
            select: { id: true, username: true, pfpUrl: true },
        });
        if (!user) return null;

        // 2. Fetch GamePlayer record (which includes rank, score, and claim status)
        const gamePlayer = await prisma.gamePlayer.findUnique({
            where: { gameId_userId: { gameId, userId: user.id } },
            select: {
                score: true,
                rank: true,
                claimedAt: true,
                game: {
                    select: {
                        title: true,
                        theme: true,
                        // Include user's ticket for winnings calculation
                        tickets: {
                            where: { userId: user.id, status: "PAID" },
                            select: { amountUSDC: true },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (!gamePlayer || gamePlayer.rank === null) {
            // If the game hasn't finished scoring, we shouldn't show this page, or we redirect.
            // For now, return null.
            return null;
        }

        const winnings = gamePlayer.game.tickets[0]?.amountUSDC ?? 0;

        return {
            gameId,
            gameTitle: gamePlayer.game.title,
            gameTheme: gamePlayer.game.theme,
            playerScore: gamePlayer.score,
            playerRank: gamePlayer.rank,
            playerWinnings: winnings,
            claimedAt: gamePlayer.claimedAt,
            userInfo: {
                username: user.username ?? "Player",
                pfpUrl: user.pfpUrl ?? "/images/avatars/a.png",
            },
        };
    }
);

export default async function GameDetailsPage({
    params,
    searchParams,
}: {
    params: { gameId: string };
    searchParams: { fid: string };
}) {
    const gameIdNum = Number(params.gameId);
    const fidNum = Number(searchParams.fid);

    if (isNaN(gameIdNum) || isNaN(fidNum)) {
        redirect("/profile");
    }

    const payloadPromise = getGameDetails(gameIdNum, fidNum);

    return (
        <>
            <SubHeader title="GAME DETAILS" />
            <GameDetailsClient payloadPromise={payloadPromise} />
        </>
    );
}