import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export const alt = "Waffles Game Score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface OgImageSearchParams {
  username?: string;
  score?: string;
}

/**
 * Dynamically generates an Open Graph (OG) image displaying a user's score.
 */
export default async function Image(req: NextRequest) {
  try {
    const fontDisplayData = await fetch(
      new URL("../../lib/fonts/editundo_bd.ttf", import.meta.url)
    ).then((res) => res.arrayBuffer());

    const { searchParams } = new URL(req.url);

    const params: OgImageSearchParams = Object.fromEntries(
      searchParams.entries()
    );
    const username = params.username?.trim() || "Player";
    const score = /^\d+$/.test(params.score || "") ? params.score || "0" : "0";
    const formattedScore = parseInt(score, 10).toLocaleString();

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, #1E1E1E 0%, #050505 100%)",
            width: "100%",
            height: "100%",
            color: "white",
            fontFamily: '"Edit Undo BRK"',
            padding: "40px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 72,
              color: "#FFC931",
              margin: "0 0 20px 0",
              letterSpacing: "-0.02em",
            }}
          >
            {" "}
            WAFFLE SCORE! 🧇
          </h1>
          <p style={{ fontSize: 48, margin: "0 0 15px 0", color: "#E0E0E0" }}>
            {" "}
            {username}
          </p>
          <p style={{ fontSize: 36, margin: 0, color: "#99A0AE" }}>
            {" "}
            {formattedScore} pts
          </p>
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: "Edit Undo BRK",
            data: fontDisplayData,
            style: "normal",
            weight: 400,
          },
        ],
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
