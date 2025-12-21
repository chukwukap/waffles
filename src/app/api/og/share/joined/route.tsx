import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { fetchOGImage } from "@/lib/cloudinary-og";

export const runtime = "nodejs";

/**
 * GET /api/og/share/joined
 * Generate "Joined game" share image using Cloudinary
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const gameId = searchParams.get("gameId");
        const fid = searchParams.get("fid");

        // Require both params
        if (!gameId || !fid) {
            return new Response("Missing gameId or fid", { status: 400 });
        }

        // Fetch game and user data
        const [game, user] = await Promise.all([
            prisma.game.findUnique({
                where: { id: parseInt(gameId) },
                select: {
                    prizePool: true,
                    theme: true,
                    playerCount: true,
                },
            }),
            prisma.user.findUnique({
                where: { fid: parseInt(fid) },
                select: { username: true, pfpUrl: true },
            }),
        ]);

        if (!game || !user) {
            return new Response("Game or user not found", { status: 404 });
        }

        // Format data
        const username = user.username || `fid:${fid}`;
        const othersCount = Math.max(0, game.playerCount - 1);

        // Generate image via Cloudinary
        return fetchOGImage({
            template: "joined",
            username,
            pfpUrl: user.pfpUrl || undefined,
            prizePool: game.prizePool,
            theme: game.theme || "TRIVIA",
            othersCount,
        });
    } catch (error) {
        console.error("OG image generation error:", error);
        return new Response("Failed to generate image", { status: 500 });
    }
}