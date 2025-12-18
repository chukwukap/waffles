import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// 2x scale for retina quality
const SCALE = 2;

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
                    coverUrl: true,
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
        const pfpUrl = user.pfpUrl;
        const prizePool = `$${game.prizePool.toLocaleString()}`;
        const theme = game.theme?.toUpperCase() || "TRIVIA";
        const playerCount = game.playerCount;
        const othersCount = Math.max(0, playerCount - 1);

        // Load assets from filesystem
        const publicDir = join(process.cwd(), "public");
        const fontPath = join(publicDir, "fonts/editundo_bd.ttf");
        const bodyFontPath = join(publicDir, "fonts/brockmann_bd.otf");
        const bgPath = join(publicDir, "images/share/joined-bg.png");
        const moneyPath = join(publicDir, "images/share/money.png");

        const [pixelFontData, bodyFontData, bgBuffer, moneyBuffer] = await Promise.all([
            readFile(fontPath),
            readFile(bodyFontPath),
            readFile(bgPath),
            readFile(moneyPath),
        ]);

        // Convert to base64
        const bgBase64 = `data:image/png;base64,${bgBuffer.toString("base64")}`;
        const moneyBase64 = `data:image/png;base64,${moneyBuffer.toString("base64")}`;

        // Convert remote image URL to base64 for ImageResponse
        let pfpBase64 = "";
        if (pfpUrl) {
            try {
                const res = await fetch(pfpUrl);
                const buffer = await res.arrayBuffer();
                const base64 = Buffer.from(buffer).toString("base64");
                const contentType = res.headers.get("content-type") || "image/png";
                pfpBase64 = `data:${contentType};base64,${base64}`;
            } catch (e) {
                console.error("Failed to fetch pfp:", e);
            }
        }

        // Load theme icon if coverUrl exists
        let themeIconBase64 = "";
        if (game.coverUrl) {
            try {
                const res = await fetch(game.coverUrl);
                const buffer = await res.arrayBuffer();
                const base64 = Buffer.from(buffer).toString("base64");
                const contentType = res.headers.get("content-type") || "image/png";
                themeIconBase64 = `data:${contentType};base64,${base64}`;
            } catch (e) {
                console.error("Failed to fetch theme icon:", e);
            }
        }

        // All sizes scaled by SCALE factor for retina quality
        // Figma dimensions: main 531x359, inner 461x197.5
        return new ImageResponse(
            (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(${bgBase64})`,
                        backgroundSize: "100% 100%",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: '"PixelFont"',
                    }}
                >
                    {/* Ticket Card */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            width: `${800 * SCALE}px`,
                            height: `${340 * SCALE}px`,
                            border: `${2 * SCALE}px solid #FFC931`,
                            borderRadius: `${32 * SCALE}px`,
                            padding: `${48 * SCALE}px ${36 * SCALE}px`,
                            backgroundColor: "transparent",
                        }}
                    >
                        {/* Top Row: Profile + Avatar Stack */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                width: "100%",
                            }}
                        >
                            {/* Profile Section */}
                            <div style={{ display: "flex", alignItems: "center", gap: `${16 * SCALE}px` }}>
                                {/* Profile Picture */}
                                {pfpBase64 ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={pfpBase64}
                                        width={90 * SCALE}
                                        height={90 * SCALE}
                                        alt="Profile"
                                        style={{
                                            borderRadius: "50%",
                                            border: `${2 * SCALE}px solid #333`,
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: `${90 * SCALE}px`,
                                            height: `${90 * SCALE}px`,
                                            borderRadius: "50%",
                                            backgroundColor: "#D9D9D9",
                                            border: `${2 * SCALE}px solid #333`,
                                        }}
                                    />
                                )}

                                {/* Name + Subtitle */}
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span
                                        style={{
                                            color: "white",
                                            fontSize: `${40 * SCALE}px`,
                                            lineHeight: "130%",
                                        }}
                                    >
                                        {username.toUpperCase()}
                                    </span>
                                    <span
                                        style={{
                                            color: "#999999",
                                            fontSize: `${24 * SCALE}px`,
                                            fontFamily: '"BodyFont"',
                                        }}
                                    >
                                        has joined the next game
                                    </span>
                                </div>
                            </div>

                            {/* Others Count */}
                            {othersCount > 0 && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: `${8 * SCALE}px`,
                                        color: "white",
                                        fontSize: `${16 * SCALE}px`,
                                        fontFamily: '"BodyFont"',
                                    }}
                                >
                                    +{othersCount} others
                                </div>
                            )}
                        </div>

                        {/* Bottom Row: Prize Pool + Theme */}
                        <div
                            style={{
                                display: "flex",
                                gap: `${16 * SCALE}px`,
                                marginTop: "auto",
                            }}
                        >
                            {/* Prize Pool */}
                            <div style={{ display: "flex", alignItems: "center", gap: `${11 * SCALE}px` }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={moneyBase64}
                                    width={42 * SCALE}
                                    height={42 * SCALE}
                                    alt="Money"
                                    style={{ objectFit: "contain" }}
                                />
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span
                                        style={{
                                            color: "#99A0AE",
                                            fontSize: `${20 * SCALE}px`,
                                            fontFamily: '"BodyFont"',
                                        }}
                                    >
                                        Prize pool
                                    </span>
                                    <span style={{ color: "white", fontSize: `${32 * SCALE}px` }}>
                                        {prizePool}
                                    </span>
                                </div>
                            </div>

                            {/* Theme */}
                            <div style={{ display: "flex", alignItems: "center", gap: `${11 * SCALE}px` }}>
                                {themeIconBase64 ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={themeIconBase64}
                                        width={38 * SCALE}
                                        height={38 * SCALE}
                                        alt="Theme"
                                        style={{ objectFit: "contain" }}
                                    />
                                ) : (
                                    <span style={{ fontSize: `${32 * SCALE}px` }}>🎯</span>
                                )}
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span
                                        style={{
                                            color: "#99A0AE",
                                            fontSize: `${20 * SCALE}px`,
                                            fontFamily: '"BodyFont"',
                                        }}
                                    >
                                        Theme
                                    </span>
                                    <span style={{ color: "white", fontSize: `${32 * SCALE}px` }}>
                                        {theme}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200 * SCALE,
                height: 630 * SCALE,
                fonts: [
                    {
                        name: "PixelFont",
                        data: pixelFontData.buffer as ArrayBuffer,
                        style: "normal",
                        weight: 700 as const,
                    },
                    {
                        name: "BodyFont",
                        data: bodyFontData.buffer as ArrayBuffer,
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