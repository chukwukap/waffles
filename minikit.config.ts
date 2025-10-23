import { MiniAppManifest } from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";

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
    screenshotUrls: [`${env.rootUrl}/screenshot-portrait.png`],
    iconUrl: `${env.rootUrl}/logo.png`,
    splashImageUrl: `${env.rootUrl}/images/splash-icon.png`,
    splashBackgroundColor: "#000000",
    homeUrl: env.rootUrl,
    webhookUrl: `${env.rootUrl}/api/webhook`,
    primaryCategory: "games",
    tags: ["waffles", "miniapp", "social"],
    heroImageUrl: `${env.rootUrl}/images/splash-image.png`,
    tagline: "Play instantly",
    ogTitle: "Waffles",
    ogDescription: "Pattern-matching tournaments built for Farcaster.",
    ogImageUrl: `${env.rootUrl}/og.png`,
  },
};
