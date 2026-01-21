import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { safeImageUrl, OG_WIDTH, OG_HEIGHT } from "../utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const waitlistRank = searchParams.get("rank");
    const pfpUrlParam = searchParams.get("pfpUrl"); // Now passed as query param

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

    // Validate rank
    const validatedRank = waitlistRank.match(/^[0-9]{1,6}$/)
      ? `#${waitlistRank}`
      : "#?";

    // Load assets from filesystem (required for ImageResponse)
    const publicDir = join(process.cwd(), "public");
    const fontPath = join(publicDir, "fonts/editundo_bd.ttf");
    const bgPath = join(publicDir, "images/share/waitlist-bg.png");
    const logoPath = join(publicDir, "logo-onboarding.png");
    const scrollPath = join(publicDir, "images/share/scroll.png");

    // Load assets and safely fetch pfpUrl in parallel
    const [fontData, bgBuffer, logoBuffer, scrollBuffer, safePfpUrl] = await Promise.all([
      readFile(fontPath),
      readFile(bgPath),
      readFile(logoPath),
      readFile(scrollPath),
      safeImageUrl(pfpUrlParam), // Returns null if fetch fails
    ]);

    // Convert to base64 (required for ImageResponse)
    const bgBase64 = `data:image/png;base64,${bgBuffer.toString("base64")}`;
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    const scrollBase64 = `data:image/png;base64,${scrollBuffer.toString(
      "base64"
    )}`;

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            backgroundImage: `url(${bgBase64})`,
            backgroundSize: "100% 100%",
            padding: "40px 20px",
            fontFamily: '"PixelFont"',
            color: "white",
            letterSpacing: "1px",
          }}
        >
          {/* Logo */}
          {/*  eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoBase64} width="212" height="42" alt="WAFFLES Logo" />

          {/* Middle Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: 20,
              marginTop: 60,
            }}
          >
            {/* User Avatar */}
            {safePfpUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={safePfpUrl}
                width="120"
                height="120"
                alt="User Avatar"
                style={{
                  borderRadius: "50%",
                  border: "4px solid #5DD9C1",
                  marginBottom: 20,
                }}
              />
            )}

            {/* Rank Text */}
            <div style={{ display: "flex", fontSize: 100 }}>
              <span style={{ color: "#FCD34D" }}>{validatedRank}</span>
              &nbsp;ON THE
            </div>

            {/* Waitlist Text */}
            <div style={{ fontSize: 100 }}>WAITLIST</div>

            {/* Scroll Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={scrollBase64}
              width="250"
              height="277"
              alt="Waitlist Scroll"
              style={{ marginTop: 40 }}
            />
          </div>
        </div>
      ),
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
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
