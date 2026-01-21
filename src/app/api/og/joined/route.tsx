/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { OG_WIDTH, OG_HEIGHT, COLORS, safeImageUrl } from "../utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;

        // Parse params
        const username = searchParams.get("username") || "User";
        const prizePool = searchParams.get("prizePool") || "0";
        const theme = searchParams.get("theme") || "General";
        const pfpUrlParam = searchParams.get("pfpUrl");
        const themeImageUrl = searchParams.get("themeImageUrl");

        // Require themeImageUrl
        if (!themeImageUrl) {
            return new Response("Missing required parameter: themeImageUrl", { status: 400 });
        }

        // Load assets from filesystem
        const publicDir = join(process.cwd(), "public");
        const bgPath = join(publicDir, "images/share/waitlist-bg.png");
        const moneyPath = join(publicDir, "images/share/money.png");
        const fontPath = join(publicDir, "fonts/editundo_bd.ttf");
        const brockmannPath = join(process.cwd(), "src/lib/fonts/brockmann_bd.otf");

        // Load assets and safely fetch pfpUrl in parallel
        const [bgBuffer, moneyBuffer, fontData, brockmannData, safePfpUrl] = await Promise.all([
            readFile(bgPath),
            readFile(moneyPath),
            readFile(fontPath),
            readFile(brockmannPath),
            safeImageUrl(pfpUrlParam), // Returns null if fetch fails
        ]);

        // Convert to base64
        const bgImage = `data:image/png;base64,${bgBuffer.toString("base64")}`;
        const moneyIcon = `data:image/png;base64,${moneyBuffer.toString("base64")}`;

        // Format prize pool
        const formattedPrize = `$${Number(prizePool).toLocaleString()}`;

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
                        padding: 48,
                    }}
                >
                    {/* Card Container - matches GameSummaryCard design */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                            width: 722, // Scaled up from 361px (2x for OG)
                            height: 302, // Scaled up from 151px (2x for OG)
                            background: "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 201, 49, 0.12) 100%)",
                            border: "2px solid rgba(255, 201, 49, 0.4)",
                            borderRadius: 32, // Scaled up from 16px
                        }}
                    >
                        {/* ─────────── Top Row: User avatar + name ─────────── */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 20, // Scaled from 10px
                                position: "absolute",
                                top: 32, // Scaled from 16px
                                left: 28, // Scaled from 14px
                            }}
                        >
                            {/* Avatar */}
                            <div
                                style={{
                                    width: 108, // Scaled from 54px
                                    height: 108,
                                    borderRadius: "50%",
                                    background: "#D9D9D9",
                                    overflow: "hidden",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {safePfpUrl ? (
                                    <img
                                        src={safePfpUrl}
                                        alt="Avatar"
                                        width={108}
                                        height={108}
                                        style={{ objectFit: "cover" }}
                                    />
                                ) : (
                                    <span
                                        style={{
                                            fontFamily: "EditUndo",
                                            fontSize: 56, // Scaled from 23px
                                            color: COLORS.white,
                                        }}
                                    >
                                        {username[0]?.toUpperCase() ?? "•"}
                                    </span>
                                )}
                            </div>

                            {/* Username + subtitle */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "flex-start",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "EditUndo",
                                        fontSize: 56, // Scaled from 23px
                                        lineHeight: "130%",
                                        color: COLORS.white,
                                    }}
                                >
                                    {username.toUpperCase()}
                                </span>
                                <span
                                    style={{
                                        fontFamily: "Brockmann",
                                        fontSize: 34, // Scaled from 14px
                                        lineHeight: "130%",
                                        letterSpacing: "-0.03em",
                                        color: COLORS.grayLabel,
                                    }}
                                >
                                    has joined the next game
                                </span>
                            </div>
                        </div>

                        {/* ─────────── Bottom Row: Prize Pool + Theme ─────────── */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 24, // Scaled from 12px
                                position: "absolute",
                                bottom: 32, // Scaled from 16px
                                left: 30, // Scaled from 15px
                            }}
                        >
                            {/* Prize Pool */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 16, // Scaled from 8px
                                }}
                            >
                                <img
                                    src={moneyIcon}
                                    alt="Prize"
                                    width={54}
                                    height={56}
                                />
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "Brockmann",
                                            fontSize: 28, // Scaled from 11.38px
                                            lineHeight: "130%",
                                            letterSpacing: "-0.03em",
                                            color: COLORS.grayLabel,
                                        }}
                                    >
                                        Prize pool
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: "EditUndo",
                                            fontSize: 42, // Scaled from 17.07px
                                            lineHeight: "100%",
                                            color: COLORS.white,
                                        }}
                                    >
                                        {formattedPrize}
                                    </span>
                                </div>
                            </div>

                            {/* Theme */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 16,
                                }}
                            >
                                <img
                                    src={themeImageUrl}
                                    alt="Theme"
                                    width={58}
                                    height={56}
                                />
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "Brockmann",
                                            fontSize: 28,
                                            lineHeight: "130%",
                                            letterSpacing: "-0.03em",
                                            color: COLORS.grayLabel,
                                        }}
                                    >
                                        Theme
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: "EditUndo",
                                            fontSize: 42,
                                            lineHeight: "100%",
                                            color: COLORS.white,
                                        }}
                                    >
                                        {theme.toUpperCase()}
                                    </span>
                                </div>
                            </div>
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
                    {
                        name: "Brockmann",
                        data: brockmannData.buffer as ArrayBuffer,
                        style: "normal",
                        weight: 700,
                    },
                ],
            }
        );
    } catch (error) {
        console.error("OG image generation error:", error);
        return new Response("Failed to generate image", { status: 500 });
    }
}
