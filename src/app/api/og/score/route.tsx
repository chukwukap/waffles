/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { OG_WIDTH, OG_HEIGHT, safeImageUrl } from "../utils";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

/**
 * Score Share OG Image
 * 
 * Params:
 * - score: number (required)
 * - username: string (required)
 * - pfpUrl: string (optional)
 * - gameNumber: number (required) - e.g. 1 for "WAFFLES #001"
 * - category: string (required) - e.g. "Pop Culture"
 * - rank: number (optional) - current rank, shows "Rank not finalized" if missing
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Parse params
    const score = parseInt(searchParams.get("score") || "0", 10);
    const username = searchParams.get("username") || "Player";
    const pfpUrlParam = searchParams.get("pfpUrl");
    const gameNumber = parseInt(searchParams.get("gameNumber") || "1", 10);
    const category = searchParams.get("category") || "Trivia";
    const rankParam = searchParams.get("rank");
    const rank = rankParam ? parseInt(rankParam, 10) : null;

    // Load assets
    const publicDir = join(process.cwd(), "public");
    const [fontData, logoBuffer, bgBuffer, safePfpUrl] = await Promise.all([
        readFile(join(publicDir, "fonts/editundo_bd.ttf")),
        readFile(join(publicDir, "logo-onboarding.png")),
        readFile(join(publicDir, "images/share/waitlist-bg.png")),
        safeImageUrl(pfpUrlParam),
    ]);

    // Convert to base64
    const logoImage = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    const bgImage = `data:image/png;base64,${bgBuffer.toString("base64")}`;

    // Format game name
    const gameName = `WAFFLES #${String(gameNumber).padStart(3, "0")}`;
    const rankText = rank ? `#${rank}` : "Pending";

    return new ImageResponse(
        (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    fontFamily: "EditUndo",
                    padding: "40px",
                    position: "relative",
                }}
            >
                {/* Logo at top */}
                <img
                    src={logoImage}
                    alt="Waffles"
                    width={140}
                    height={28}
                    style={{ position: "absolute", top: 40, left: 40 }}
                />

                {/* Main content card */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 16,
                        padding: "40px 60px",
                        background: "rgba(0, 0, 0, 0.4)",
                        borderRadius: 24,
                        border: "2px solid rgba(255, 201, 49, 0.3)",
                    }}
                >
                    {/* Game name + Category */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 40, color: "#FFFFFF", letterSpacing: "0.02em" }}>
                            {gameName}
                        </span>
                        <span style={{ fontSize: 28, color: "#99A0AE", textTransform: "capitalize" }}>
                            {category}
                        </span>
                    </div>

                    {/* PFP + Username row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
                        {safePfpUrl ? (
                            <img
                                src={safePfpUrl}
                                alt="Profile"
                                width={64}
                                height={64}
                                style={{
                                    borderRadius: "50%",
                                    border: "3px solid #FFC931",
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #FFC931 0%, #FF6B35 100%)",
                                    border: "3px solid #FFC931",
                                }}
                            />
                        )}
                        <span style={{ fontSize: 36, color: "#FFFFFF" }}>
                            @{username}
                        </span>
                    </div>

                    {/* Score - Large */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 8 }}>
                        <span style={{ fontSize: 24, color: "#99A0AE", letterSpacing: "0.1em" }}>
                            SCORED
                        </span>
                        <span
                            style={{
                                fontSize: 96,
                                color: "#FFC931",
                                lineHeight: 1,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {score.toLocaleString()}
                        </span>
                        <span style={{ fontSize: 32, color: "#FFC931", marginTop: 4 }}>
                            POINTS
                        </span>
                    </div>

                    {/* Rank */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 8,
                            padding: "8px 20px",
                            background: "rgba(20, 185, 133, 0.2)",
                            borderRadius: 12,
                            border: "1px solid rgba(20, 185, 133, 0.4)",
                        }}
                    >
                        <span style={{ fontSize: 24, color: "#14B985" }}>
                            RANK: {rankText}
                        </span>
                    </div>
                </div>
            </div>
        ),
        {
            width: OG_WIDTH,
            height: OG_HEIGHT,
            fonts: [
                {
                    name: "EditUndo",
                    data: fontData.buffer as ArrayBuffer,
                    style: "normal",
                    weight: 700,
                },
            ],
        }
    );
}
