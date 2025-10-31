import { MiniAppManifest } from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig: MiniAppManifest = {
  accountAssociation: {
    header:
      "eyJmaWQiOjc1NTA3NCwidHlwZSI6ImF1dGgiLCJrZXkiOiIweERBYjk0NWQwODFFMDVlOEM0NzFlNTRGNTE0QURCOUM4NmYzYTJlYTQifQ",
    payload: "eyJkb21haW4iOiJ0cm95LW1pdGVyZWQtcGVhcmwubmdyb2stZnJlZS5kZXYifQ",
    signature:
      "0UbE3jjMUoyf3380WZkF/XbssRr0P9yIMJmxjEMkk/twHXBWFMZxKb60si6nd3zVyh3pJR6O12aMSO8Ybk+Qnxs=",
  },
  miniapp: {
    version: "1",
    name: "Waffles",
    subtitle: "Waffles",
    description: "Pattern-matching tournaments built for Farcaster.",
    screenshotUrls: [
      `${env.rootUrl}/images/screenshots/1.png`,
      `${env.rootUrl}/images/screenshots/2.png`,
      `${env.rootUrl}/images/screenshots/3.png`,
    ],
    iconUrl: `${env.rootUrl}/icon.png`,
    splashImageUrl: `${env.rootUrl}/images/splash-icon.png`,
    splashBackgroundColor: "#1E1E1E",
    homeUrl: env.rootUrl,
    webhookUrl: `${env.rootUrl}/api/webhook`,
    primaryCategory: "games",
    tags: ["waffles", "games", "social", "fun"],
    heroImageUrl: `${env.rootUrl}/images/hero-image.png`,
    tagline: "Play daily social games",
    ogTitle: "Waffles",
    ogDescription: "Play daily social games",
    ogImageUrl: `${env.rootUrl}/og.png`,
    noindex: true,
  },
};
