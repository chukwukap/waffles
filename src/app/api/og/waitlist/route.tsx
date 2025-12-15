import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const waitlistRank = searchParams.get("rank");
    const fidParam = searchParams.get("fid");

    // If no rank, return default image
    if (!waitlistRank) {
      const defaultImagePath = join(
        process.cwd(),
        "public/images/share/waitlist-default.png"
      );
      const defaultImageBuffer = await readFile(defaultImagePath);

      return new Response(defaultImageBuffer, {
        status: 200,
        headers: {
          "content-type": "image/png",
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

    // Validate and format rank
    const rankNum = parseInt(waitlistRank);
    const validatedRank = !isNaN(rankNum) && rankNum > 0 ? rankNum : null;

    // Fetch user data
    let pfpUrl: string | null = null;
    let username: string | null = null;
    if (fidParam) {
      try {
        const fid = parseInt(fidParam);
        const user = await prisma.user.findUnique({
          where: { fid },
          select: { pfpUrl: true, username: true },
        });
        pfpUrl = user?.pfpUrl || null;
        username = user?.username || null;
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    }

    // Load font
    const publicDir = join(process.cwd(), "public");
    const fontPath = join(publicDir, "fonts/editundo_bd.ttf");
    const fontData = await readFile(fontPath);

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            background: "linear-gradient(145deg, #0a0a0a 0%, #151520 50%, #0a0a0a 100%)",
            fontFamily: '"PixelFont"',
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background grid pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(255,201,49,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,201,49,0.03) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Glowing orbs */}
          <div
            style={{
              position: "absolute",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,201,49,0.15) 0%, transparent 70%)",
              top: -100,
              right: -100,
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(27,143,245,0.12) 0%, transparent 70%)",
              bottom: -50,
              left: -50,
              filter: "blur(40px)",
            }}
          />

          {/* Content container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              padding: "60px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Top: WAFFLES text logo */}
            <div
              style={{
                display: "flex",
                fontSize: 42,
                letterSpacing: "8px",
                color: "#FFC931",
                marginBottom: 50,
                textShadow: "0 0 30px rgba(255,201,49,0.5)",
              }}
            >
              WAFFLES
            </div>

            {/* Center: Avatar + Rank */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 30,
              }}
            >
              {/* Avatar with ring */}
              {pfpUrl && (
                <div
                  style={{
                    display: "flex",
                    position: "relative",
                  }}
                >
                  {/* Outer glow ring */}
                  <div
                    style={{
                      position: "absolute",
                      inset: -8,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #FFC931 0%, #FF8C00 100%)",
                      opacity: 0.6,
                      filter: "blur(15px)",
                    }}
                  />
                  {/* Avatar */}
                  <img
                    src={pfpUrl}
                    width="140"
                    height="140"
                    alt="Avatar"
                    style={{
                      borderRadius: "50%",
                      border: "4px solid #FFC931",
                      position: "relative",
                    }}
                  />
                </div>
              )}

              {/* Rank display */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {/* Big rank number */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 160,
                      fontWeight: 700,
                      background: "linear-gradient(180deg, #FFC931 0%, #FF8C00 100%)",
                      backgroundClip: "text",
                      color: "transparent",
                      lineHeight: 1,
                      textShadow: "0 4px 30px rgba(255,201,49,0.4)",
                    }}
                  >
                    #{validatedRank || "?"}
                  </span>
                </div>

                {/* "ON THE WAITLIST" text */}
                <div
                  style={{
                    display: "flex",
                    fontSize: 32,
                    letterSpacing: "6px",
                    color: "rgba(255,255,255,0.7)",
                    marginTop: 10,
                  }}
                >
                  ON THE WAITLIST
                </div>

                {/* Username if available */}
                {username && (
                  <div
                    style={{
                      display: "flex",
                      fontSize: 24,
                      color: "rgba(255,255,255,0.4)",
                      marginTop: 8,
                    }}
                  >
                    @{username}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom CTA */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 60,
                padding: "16px 32px",
                background: "rgba(255,201,49,0.1)",
                borderRadius: 16,
                border: "1px solid rgba(255,201,49,0.3)",
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  color: "#FFC931",
                  letterSpacing: "2px",
                }}
              >
                JOIN THE WAITLIST →
              </span>
            </div>
          </div>

          {/* Bottom decorative line */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "linear-gradient(90deg, transparent 0%, #FFC931 50%, transparent 100%)",
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "PixelFont",
            data: fontData.buffer as ArrayBuffer,
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
