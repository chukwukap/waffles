import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { fetchOGImage } from "@/lib/cloudinary-og";

export const runtime = "nodejs";

/**
 * GET /api/og/share/prize
 * Generate "Prize won" share image using Cloudinary
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

        // Fetch game entry and user data
        const entry = await prisma.gameEntry.findFirst({
            where: {
                gameId: parseInt(gameId),
                user: { fid: parseInt(fid) },
            },
            select: {
                prize: true,
                rank: true,
                user: {
                    select: {
                        username: true,
                        pfpUrl: true,
                    },
                },
            },
        });

        if (!entry || !entry.user) {
            return new Response("Entry not found", { status: 404 });
        }

        // Generate image via Cloudinary
        return fetchOGImage({
            template: "prize",
            username: entry.user.username || `fid:${fid}`,
            pfpUrl: entry.user.pfpUrl || undefined,
            rank: entry.rank ?? 1,
            prizeAmount: entry.prize ?? 0,
        });
    } catch (error) {
        console.error("OG image generation error:", error);
        return new Response("Failed to generate image", { status: 500 });
    }
}