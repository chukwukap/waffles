import { env } from "@/lib/env";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Use Node.js runtime to allow file system access
export const runtime = "nodejs";

/**
 * API Route Handler to generate a dynamic waitlist OG image.
 *
 * Access this route via a URL like:
 * https://your-domain.com/api/og/waitlist?fid=123&rank=123&ref=123
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Get the 'rank' and 'pfpUrl' query parameters
    const hasRank = searchParams.has("rank");
    const waitlistRank = hasRank ? searchParams.get("rank") : null;
    const pfpUrl = searchParams.get("pfpUrl");

    // If rank is not passed in, return the default waitlist image immediately
    if (!waitlistRank) {
      // Read default image from filesystem
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

    // Sanitize and validate the input. We'll allow 1-6 digits.
    // This provides a safe default and prevents layout-breaking input.
    let validatedRank = "#?"; // Default fallback
    if (waitlistRank) {
      const match = waitlistRank.match(/^[0-9]{1,6}$/);
      if (match) {
        validatedRank = `#${match}`;
      }
    }

    // --- LOAD ASSETS FROM FILESYSTEM ---
    const publicDir = join(process.cwd(), "public");
    const fontPath = join(publicDir, "fonts/editundo_bd.ttf");
    const bgPath = join(publicDir, "images/share/waitlist-bg.png");
    const logoPath = join(publicDir, "logo-onboarding.png");
    const scrollPath = join(publicDir, "images/share/scroll.png");

    const [fontData, bgBuffer, logoBuffer, scrollBuffer] = await Promise.all([
      readFile(fontPath),
      readFile(bgPath),
      readFile(logoPath),
      readFile(scrollPath),
    ]);

    // Convert images to Base64 Data URIs
    const bgBase64 = `data:image/png;base64,${bgBuffer.toString("base64")}`;
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    const scrollBase64 = `data:image/png;base64,${scrollBuffer.toString("base64")}`;

    // Define the OG image JSX structure
    const element = (
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
        {/* === TOP LOGO === */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoBase64} width="212" height="42" alt="WAFFLES Logo" />
        {/* === MIDDLE CONTENT === */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* User Avatar (if provided) */}
          {pfpUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={pfpUrl}
              width="120"
              height="120"
              alt="User Avatar"
              style={{
                borderRadius: "50%",
                border: "4px solid #5DD9C1",
              }}
            />
          )}
          {/* Dynamic Text: "#4 ON THE" */}
          <div
            style={{
              display: "flex",
              fontSize: 50,
            }}
          >
            {/* The dynamic rank is yellow */}
            <span style={{ color: "#FCD34D" }}>{validatedRank}</span>
            &nbsp;ON THE
          </div>
          {/* Static Text: "WAITLIST" */}
          <div style={{ fontSize: 50 }}>WAITLIST</div>
          {/* Scroll Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scrollBase64}
            width="250"
            height="277"
            alt="Waitlist Scroll"
            style={{ marginTop: 30 }}
          />
        </div>
        {/* === BOTTOM BUTTON === */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "transparent",
            color: "#FCD34D",
            fontSize: 24,
            width: 300,
            height: 50,
            borderRadius: 25,
            border: "3px solid #FCD34D",
            letterSpacing: "0.5px",
          }}
        >
          PLAYWAFFLES.FUN
        </div>
      </div>
    );

    return new ImageResponse(element, {
      width: 800,
      height: 800,
      fonts: [
        {
          name: "Editundo BD",
          data: fontData.buffer as ArrayBuffer,
          style: "normal",
          weight: 700,
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (e: unknown) {
    console.error(e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
