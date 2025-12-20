import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Standard OG image dimensions (2x for retina)
const SCALE = 2;
const WIDTH = 600;
const HEIGHT = 600;

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

        // Format data
        const prizeAmount = entry.prize ?? 0;
        const prizeFormatted = `$${prizeAmount.toLocaleString()}`;

        // Load assets from filesystem
        const publicDir = join(process.cwd(), "public");
        const fontPath = join(publicDir, "fonts/editundo_bd.ttf");
        const chestPath = join(publicDir, "images/chest-crown.png");
        const logoPath = join(publicDir, "images/icons/waffle-small.png");

        const [pixelFontData, chestBuffer, logoBuffer] = await Promise.all([
            readFile(fontPath),
            readFile(chestPath).catch(() => null),
            readFile(logoPath).catch(() => null),
        ]);

        // Convert to base64
        const chestBase64 = chestBuffer
            ? `data:image/png;base64,${chestBuffer.toString("base64")}`
            : null;

        const logoBase64 = logoBuffer
            ? `data:image/png;base64,${logoBuffer.toString("base64")}`
            : null;

        // Convert remote PFP to base64
        let pfpBase64 = "";
        if (entry.user.pfpUrl) {
            try {
                const res = await fetch(entry.user.pfpUrl);
                const buffer = await res.arrayBuffer();
                const base64 = Buffer.from(buffer).toString("base64");
                const contentType = res.headers.get("content-type") || "image/png";
                pfpBase64 = `data:${contentType};base64,${base64}`;
            } catch (e) {
                console.error("Failed to fetch pfp:", e);
            }
        }

        return new ImageResponse(
            (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(180deg, #1E1E1E 0%, #000000 100%)",
                        fontFamily: '"PixelFont"',
                        padding: `${40 * SCALE}px`,
                    }}
                >
                    {/* Waffles Logo */}
                    {logoBase64 && (
                        <img
                            src={logoBase64}
                            alt="Waffles"
                            width={80 * SCALE}
                            height={20 * SCALE}
                            style={{ objectFit: "contain", marginBottom: `${30 * SCALE}px` }}
                        />
                    )}

                    {/* Main Content */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: 1,
                            gap: `${8 * SCALE}px`,
                        }}
                    >
                        {/* PFP + "JUST WON" row */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: `${12 * SCALE}px`,
                            }}
                        >
                            {/* User PFP */}
                            {pfpBase64 ? (
                                <img
                                    src={pfpBase64}
                                    width={50 * SCALE}
                                    height={50 * SCALE}
                                    alt="PFP"
                                    style={{
                                        borderRadius: "50%",
                                        border: `${2 * SCALE}px solid #333`,
                                        objectFit: "cover",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: `${50 * SCALE}px`,
                                        height: `${50 * SCALE}px`,
                                        borderRadius: "50%",
                                        backgroundColor: "#444",
                                        border: `${2 * SCALE}px solid #333`,
                                    }}
                                />
                            )}

                            {/* JUST WON text */}
                            <span
                                style={{
                                    color: "white",
                                    fontSize: `${32 * SCALE}px`,
                                    letterSpacing: "0.05em",
                                }}
                            >
                                JUST WON
                            </span>
                        </div>

                        {/* Prize Amount */}
                        <span
                            style={{
                                color: "#05FF8F",
                                fontSize: `${48 * SCALE}px`,
                                lineHeight: "90%",
                                marginTop: `${10 * SCALE}px`,
                            }}
                        >
                            {prizeFormatted}
                        </span>

                        {/* ON WAFFLES text */}
                        <span
                            style={{
                                color: "white",
                                fontSize: `${32 * SCALE}px`,
                                letterSpacing: "0.05em",
                                marginTop: `${10 * SCALE}px`,
                            }}
                        >
                            ON WAFFLES
                        </span>

                        {/* Treasure Chest */}
                        {chestBase64 && (
                            <img
                                src={chestBase64}
                                width={180 * SCALE}
                                height={160 * SCALE}
                                alt="Treasure"
                                style={{
                                    objectFit: "contain",
                                    marginTop: `${20 * SCALE}px`,
                                }}
                            />
                        )}
                    </div>
                </div>
            ),
            {
                width: WIDTH * SCALE,
                height: HEIGHT * SCALE,
                fonts: [
                    {
                        name: "PixelFont",
                        data: pixelFontData.buffer as ArrayBuffer,
                        style: "normal",
                        weight: 700 as const,
                    },
                ],
            }
        );
    } catch (error) {
        console.error("OG image generation error:", error);
        return new Response("Failed to generate image", { status: 500 });
    }
}