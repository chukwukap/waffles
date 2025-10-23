import { MiniAppManifest } from "@coinbase/onchainkit/minikit";

const ROOT_URL =
  "https://0b967d9de060.ngrok-free.app" ||
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig: MiniAppManifest = {
  accountAssociation: {
    header:
      "eyJmaWQiOjc1NTA3NCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDlmNWM5MzcyNzI3ZjdmNURjNTFiZUVmNjM1NGEyNTcwN0JjODk5MjgifQ",
    payload: "eyJkb21haW4iOiIwYjk2N2Q5ZGUwNjAubmdyb2stZnJlZS5hcHAifQ",
    signature:
      "thymDMXybJ5E0qkYvXSJQiHcQxelMxcani6ZRSFTj00IgAYcIeDLNc2HqRh0FfrG3GR8c/HQeCsCLGtW1ppksBs=",
  },

  miniapp: {
    version: "1",
    name: "Waffles",
    subtitle: "Waffles",
    description: "Pattern-matching tournaments built for Farcaster.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/logo.png`,
    splashImageUrl: `${ROOT_URL}/images/splash-icon.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "games",
    tags: ["waffles", "miniapp", "social"],
    heroImageUrl: `${ROOT_URL}/images/splash-image.png`,
    tagline: "Play instantly",
    ogTitle: "Waffles",
    ogDescription: "Pattern-matching tournaments built for Farcaster.",
    ogImageUrl: `${ROOT_URL}/og.png`,
  },
};
