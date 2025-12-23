/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { OG_WIDTH, OG_HEIGHT, COLORS, safeImageUrl } from "../utils";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

// Load fonts from filesystem
async function loadFonts() {
    const publicDir = join(process.cwd(), "public");
    const fontPath = join(publicDir, "fonts/editundo_bd.ttf");
    const fontData = await readFile(fontPath);
    return [
        {
            name: "EditUndo",
            data: fontData.buffer as ArrayBuffer,
            style: "normal" as const,
            weight: 700 as const,
        },
    ];
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Parse params
    const prizeAmount = searchParams.get("prizeAmount") || "0";
    const pfpUrlParam = searchParams.get("pfpUrl");

    // Load assets from filesystem
    const publicDir = join(process.cwd(), "public");
    const [fonts, chestBuffer, logoBuffer, bgBuffer, safePfpUrl] = await Promise.all([
        loadFonts(),
        readFile(join(publicDir, "images/chest-crown.png")),
        readFile(join(publicDir, "images/logo/logo-onboarding.png")),
        readFile(join(publicDir, "images/share/waitlist-bg.png")),
        safeImageUrl(pfpUrlParam),
    ]);

    // Convert to base64
    const chestImage = `data:image/png;base64,${chestBuffer.toString("base64")}`;
    const logoImage = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    const bgImage = `data:image/png;base64,${bgBuffer.toString("base64")}`;

    // Format prize amount
    const formattedPrize = `$${Number(prizeAmount).toLocaleString()}`;

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
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    fontFamily: "EditUndo",
                    padding: "40px 0",
                }}
            >
                {/* Waffles Logo */}
                <img
                    src={logoImage}
                    alt="Waffles"
                    width={160}
                    height={32}
                    style={{ marginBottom: 40 }}
                />

                {/* PFP + JUST WON row */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 16,
                        marginBottom: 12,
                    }}
                >
                    {/* Profile Picture */}
                    {safePfpUrl && (
                        <img
                            src={safePfpUrl}
                            alt="Profile"
                            width={56}
                            height={56}
                            style={{
                                borderRadius: "50%",
                                border: `3px solid ${COLORS.gold}`,
                            }}
                        />
                    )}

                    {/* JUST WON text */}
                    <span
                        style={{
                            fontSize: 48,
                            color: COLORS.white,
                            letterSpacing: "0.05em",
                        }}
                    >
                        JUST WON
                    </span>
                </div>

                {/* Prize Amount - Large and prominent */}
                <span
                    style={{
                        fontSize: 96,
                        color: COLORS.green,
                        lineHeight: 1,
                        marginBottom: 8,
                        letterSpacing: "-0.02em",
                        textShadow: "0 0 40px rgba(5, 255, 143, 0.4)",
                    }}
                >
                    {formattedPrize}
                </span>

                {/* ON WAFFLES */}
                <span
                    style={{
                        fontSize: 48,
                        color: COLORS.white,
                        letterSpacing: "0.05em",
                        marginBottom: 24,
                    }}
                >
                    ON WAFFLES
                </span>

                {/* Treasure Chest */}
                <img
                    src={chestImage}
                    alt="Treasure"
                    width={280}
                    height={200}
                    style={{
                        objectFit: "contain",
                    }}
                />
            </div>
        ),
        {
            width: OG_WIDTH,
            height: OG_HEIGHT,
            fonts,
        }
    );
}
