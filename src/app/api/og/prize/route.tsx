/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { OG_WIDTH, OG_HEIGHT, safeImageUrl } from "../utils";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Parse params
    const prizeAmount = searchParams.get("prizeAmount") || "0";
    const pfpUrlParam = searchParams.get("pfpUrl");

    // Load assets from filesystem
    const publicDir = join(process.cwd(), "public");
    const [fontData, logoBuffer, chestBuffer, bgBuffer, safePfpUrl] = await Promise.all([
        readFile(join(publicDir, "fonts/editundo_bd.ttf")),
        readFile(join(publicDir, "logo-onboarding.png")),
        readFile(join(publicDir, "images/illustrations/treasure-chest.png")),
        readFile(join(publicDir, "images/share/waitlist-bg.png")),
        safeImageUrl(pfpUrlParam),
    ]);

    // Convert to base64
    const logoImage = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    const chestImage = `data:image/png;base64,${chestBuffer.toString("base64")}`;
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
                    position: "relative",
                }}
            >
                {/* Waffles Logo at top */}
                <img
                    src={logoImage}
                    alt="Waffles"
                    width={160}
                    height={32}
                    style={{ marginBottom: 50 }}
                />

                {/* PFP + JUST WON row */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        marginBottom: 4,
                    }}
                >
                    {/* Profile Picture - circular with border */}
                    {safePfpUrl && (
                        <img
                            src={safePfpUrl}
                            alt="Profile"
                            width={50}
                            height={50}
                            style={{
                                borderRadius: "50%",
                                border: "3px solid #FFC931",
                            }}
                        />
                    )}

                    {/* JUST WON text */}
                    <span
                        style={{
                            fontSize: 36,
                            color: "#FFFFFF",
                            letterSpacing: "0.02em",
                        }}
                    >
                        JUST WON
                    </span>
                </div>

                {/* Prize Amount - Large green text */}
                <span
                    style={{
                        fontSize: 72,
                        color: "#05FF8F",
                        lineHeight: 1,
                        marginBottom: 4,
                        letterSpacing: "-0.02em",
                    }}
                >
                    {formattedPrize}
                </span>

                {/* ON WAFFLES */}
                <span
                    style={{
                        fontSize: 36,
                        color: "#FFFFFF",
                        letterSpacing: "0.02em",
                        marginBottom: 20,
                    }}
                >
                    ON WAFFLES
                </span>

                {/* Treasure Chest - at bottom */}
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
