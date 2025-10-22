import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  searchParams,
}: {
  searchParams: { username?: string; score?: string };
}) {
  const { username = "Player", score = "0" } = searchParams;
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #1E1E1E 0%, #000000 100%)",
          width: "100%",
          height: "100%",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <h1 style={{ fontSize: 64, color: "#FFD700" }}>Waffles Champion</h1>
        <p style={{ fontSize: 36 }}>{username}</p>
        <p style={{ fontSize: 28, color: "#BBB" }}>{score} pts</p>
      </div>
    ),
    { ...size }
  );
}
