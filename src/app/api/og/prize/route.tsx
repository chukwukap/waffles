/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { loadOGFonts, OG_WIDTH, OG_HEIGHT, COLORS, safeImageUrl } from "../utils";

export const runtime = "edge";

// Load chest image as base64 for edge runtime
async function loadChestImage(): Promise<string> {
    const response = await fetch(
        new URL("../../../../public/images/chest-crown.png", import.meta.url)
    );
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:image/png;base64,${base64}`;
}

// Load logo image
async function loadLogoImage(): Promise<string> {
    const response = await fetch(
        new URL("../../../../public/images/logo/logo-onboarding.png", import.meta.url)
    );
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:image/png;base64,${base64}`;
}

// Load background image (same as waitlist)
async function loadBgImage(): Promise<string> {
    const response = await fetch(
        new URL("../../../../public/images/share/waitlist-bg.png", import.meta.url)
    );
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:image/png;base64,${base64}`;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Parse params
    const prizeAmount = searchParams.get("prizeAmount") || "0";
    const pfpUrlParam = searchParams.get("pfpUrl");

    // Load fonts and assets in parallel (including safe fetch of pfpUrl)
    const [fonts, chestImage, logoImage, bgImage, safePfpUrl] = await Promise.all([
        loadOGFonts(),
        loadChestImage(),
        loadLogoImage(),
        loadBgImage(),
        safeImageUrl(pfpUrlParam), // Returns null if fetch fails
    ]);

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
