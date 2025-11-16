import { env } from "@/lib/env";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// Set the runtime to edge for the best performance
export const runtime = "edge";

/**
 * API Route Handler to generate a dynamic waitlist OG image.
 *
 * Access this route via a URL like:
 * https://your-domain.com/api/og/waitlist?fid=123&rank=123&ref=123
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Get the 'rank' query parameter
    const hasRank = searchParams.has("rank");
    const waitlistRank = hasRank ? searchParams.get("rank") : null;

    // If rank is not passed in, return the default waitlist image immediately
    if (!waitlistRank) {
      // This is equivalent to just returning the static waitlist-default.png
      const defaultImageUrl = `${env.rootUrl}/images/share/waitlist-default.png`;
      const defaultImageRes = await fetch(defaultImageUrl);
      if (!defaultImageRes.ok) {
        return new Response("Failed to fetch default waitlist image", {
          status: 500,
        });
      }
      // Forward the correct content type header if available
      const contentType =
        defaultImageRes.headers.get("content-type") || "image/png";
      const defaultImageArrayBuffer = await defaultImageRes.arrayBuffer();
      return new Response(defaultImageArrayBuffer, {
        status: 200,
        headers: { "content-type": contentType },
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

    // --- LOAD CUSTOM FONT ---
    const fontUrl = `${env.rootUrl}/fonts/editundo_bd.ttf`;
    const fontData = await fetch(fontUrl).then((res) => res.arrayBuffer());

    // --- DEFINE IMAGE ASSET URLS ---
    const bgImageUrl = `${env.rootUrl}/images/share/waitlist-bg.png`;
    const logoImageUrl = `${env.rootUrl}/logo-onboarding.png`;
    const scrollImageUrl = `${env.rootUrl}/images/share/scroll.png`;

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
          backgroundImage: `url(${bgImageUrl})`,
          backgroundSize: "100% 100%",
          padding: "40px 20px",
          fontFamily: '"PixelFont"',
          color: "white",
          letterSpacing: "1px",
        }}
      >
        {/* === TOP LOGO === */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoImageUrl} width="212" height="42" alt="WAFFLES Logo" />
        {/* === MIDDLE CONTENT === */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Dynamic Text: "I'M #4 ON THE" */}
          <div
            style={{
              display: "flex",
              fontSize: 50,
            }}
          >
            I&apos;M&nbsp;
            {/* The dynamic rank is yellow */}
            <span style={{ color: "#FCD34D" }}>{validatedRank}</span>
            &nbsp;ON THE
          </div>
          {/* Static Text: "WAITLIST" */}
          <div style={{ fontSize: 50 }}>WAITLIST</div>
          {/* Scroll Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scrollImageUrl}
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
            backgroundColor: "#FCD34D",
            color: "#1F2937",
            fontSize: 24,
            width: 300,
            height: 50,
            borderRadius: 25,
            border: "3px solid #000",
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
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    });
  } catch (e: unknown) {
    console.error(e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
