import { ImageResponse } from "next/og";
import { env } from "@/lib/env";

// Image metadata
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
        }}
        tw="relative"
      >
        <img
          src={`${env.rootUrl || ""}/logo.png`}
          alt="Waffles Logo"
          width={120}
          height={94}
          style={{
            marginRight: "44px",
            objectFit: "contain",
            display: "block",
          }}
        />
        <span
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: "#1e1e1e",
            letterSpacing: "0.08em",
            fontFamily:
              "ui-sans-serif, system-ui, Helvetica, Arial, sans-serif",
            textTransform: "uppercase",
            lineHeight: 1,
            display: "block",
          }}
        >
          Waffles
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
