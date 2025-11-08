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
    // 1. EXTRACT AND VALIDATE URL PARAMETERS
    // ===========================================
    const { searchParams } = request.nextUrl;

    // Get the 'rank' query parameter
    const hasRank = searchParams.has("rank");
    const waitlistRank = hasRank ? searchParams.get("rank") : null;

    // Sanitize and validate the input. We'll allow 1-6 digits.
    // This provides a safe default and prevents layout-breaking input.
    let validatedRank = "#?"; // Default fallback
    if (waitlistRank) {
      const match = waitlistRank.match(/^[0-9]{1,6}$/);
      if (match) {
        validatedRank = `#${match}`;
      }
    }

    // 2. LOAD REQUIRED ASSETS (FONT & IMAGE URLS)
    // ===========================================
    // ImageResponse runs on the server and cannot access local files
    // directly. All assets (fonts, images) must be fetched from an
    // absolute URL or provided as data.

    // Get the application's base URL
    // In production (Vercel), NEXT_PUBLIC_VERCEL_URL is set automatically.
    // In development, we fall back to localhost.

    // --- LOAD CUSTOM FONT ---
    // The font file MUST be in the /public directory.
    //
    //!!! IMPORTANT!!!
    // UPDATE 'YourPixelFont.ttf' to your actual font filename.
    // (e.g., /public/fonts/PressStart2P-Regular.ttf)
    const fontUrl = `${env.rootUrl}/fonts/editundo_bd.ttf`;

    // Fetch the font and convert it to an ArrayBuffer [1, 2]
    const fontData = await fetch(fontUrl).then((res) => res.arrayBuffer());

    // --- DEFINE IMAGE ASSET URLS ---
    // All <img> tags and backgroundImages MUST use absolute URLs. [1]
    // These files MUST be in the /public directory. [3]
    //
    //!!! IMPORTANT!!!
    // UPDATE these paths to match your filenames in /public
    const bgImageUrl = `${env.rootUrl}/images/share/waitlist-bg.png`;
    const logoImageUrl = `${env.rootUrl}/logo.png`;
    const scrollImageUrl = `${env.rootUrl}/images/share/scroll.png`;

    // 3. DEFINE THE IMAGE JSX/HTML
    // ===========================================
    // This JSX is not React. It's converted by Satori, which only
    // supports flexbox, absolute positioning, and a subset of CSS. [1, 4]
    // All styles must be inline.
    const element = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between", // Pushes logo to top, button to bottom
          width: "100%",
          height: "100%",
          backgroundImage: `url(${bgImageUrl})`, // Set background image [1]
          backgroundSize: "100% 100%", // Cover the container
          padding: "40px 20px",
          fontFamily: '"PixelFont"', // Use the font name defined in options
          color: "white",
          letterSpacing: "1px",
        }}
      >
        {/* === TOP LOGO === */}
        <img src={logoImageUrl} width="212" height="42" alt="WAFFLES Logo" />

        {/* === MIDDLE CONTENT === */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20, // 'gap' is supported in flex containers
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
          <img
            src={scrollImageUrl}
            width="250"
            height="277"
            alt="Waitlist Scroll"
            style={{ marginTop: 30 }} // 'margin' is supported
          />
        </div>

        {/* === BOTTOM BUTTON === */}
        {/* We create the button with CSS for crisp, clear text */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#FCD34D", // Button yellow
            color: "#1F2937", // Dark gray text
            fontSize: 24,
            width: 300,
            height: 50,
            borderRadius: 25,
            border: "3px solid #000", // Pixel-art style border
            letterSpacing: "0.5px",
          }}
        >
          PLAYWAFFLES.FUN
        </div>
      </div>
    );

    // 4. RETURN THE IMAGERESPONSE
    // ===========================================
    return new ImageResponse(element, {
      // Set the image dimensions to match your square card
      width: 800,
      height: 800,
      // Pass the font data to the options [1]
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
    // Handle any errors during image generation
    console.log(
      `Failed to generate the image: ${
        e instanceof Error ? e.message : "Unknown error"
      }`
    );
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
