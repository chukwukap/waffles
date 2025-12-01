import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rank = searchParams.get("rank");
    const fidParam = searchParams.get("fid");

    // If no rank, use default image
    if (!rank) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/images/share/waitlist-default.png",
        },
      });
    }

    // Validate rank - 1-6 digits only
    const validatedRank = rank.match(/^[0-9]{1,6}$/)
      ? `#${rank}`
      : "#?";

    // Fetch user avatar if fid provided
    let pfpUrl: string | null = null;
    if (fidParam) {
      try {
        const fid = parseInt(fidParam);
        const user = await prisma.user.findUnique({
          where: { fid },
          select: { pfpUrl: true },
        });
        pfpUrl = user?.pfpUrl || null;
      } catch (error) {
        console.error("Failed to fetch user pfpUrl:", error);
      }
    }

    // Get base URL for image paths
    const baseUrl = new URL(request.url).origin;

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
            backgroundImage: `url(${baseUrl}/images/share/waitlist-bg.png)`,
            backgroundSize: "100% 100%",
            padding: "40px 20px",
            color: "white",
          }}
        >
          {/* Logo */}
          <img
            src={`${baseUrl}/logo-onboarding.png`}
            width="212"
            height="42"
            alt="WAFFLES"
          />

          {/* Middle Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            {/* User Avatar */}
            {pfpUrl && (
              <img
                src={pfpUrl}
                width="120"
                height="120"
                alt="Avatar"
                style={{
                  borderRadius: "50%",
                  border: "4px solid #5DD9C1",
                }}
              />
            )}

            {/* Rank Text */}
            <div style={{ display: "flex", fontSize: 50 }}>
              <span style={{ color: "#FCD34D" }}>{validatedRank}</span>
              &nbsp;ON THE
            </div>

            {/* Waitlist Text */}
            <div style={{ fontSize: 50 }}>WAITLIST</div>

            {/* Scroll Image */}
            <img
              src={`${baseUrl}/images/share/scroll.png`}
              width="250"
              height="277"
              alt="Scroll"
              style={{ marginTop: 30 }}
            />
          </div>

          {/* Button */}
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
            }}
          >
            PLAYWAFFLES.FUN
          </div>
        </div>
      ),
      {
        width: 800,
        height: 800,
      }
    );
  } catch (error) {
    console.error("OG image generation error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
